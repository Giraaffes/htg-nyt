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
	let dateStr = `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
	let timeStr = `${date.getUTCHours()}:${padNum(date.getUTCMinutes(), 2)}`;
	return capitalize(`${dateStr} kl ${timeStr}`);
}


// Nav menu
let skolebladNav = $(".sidebar .nav-item:first");
skolebladNav.html(skolebladNav.html().replace("htg-nyt", "forside"));
skolebladNav.find(".nav-link").attr("href", "/");

/*let mainMenuNav = skolebladNav.clone().insertBefore(skolebladNav);
mainMenuNav.html(mainMenuNav.html().replace("læs htg-nyt", "Hovedmenu"));
mainMenuNav.find("i").removeClass("fa-newspaper").addClass("fa-house");
mainMenuNav.find(".nav-link").attr("href", "/hovedmenu");*/

let logoutNav = $(".sidebar .nav-item:last .nav-link").html(
	"<i class=\"fas fa-right-from-bracket\" aria-hidden=\"true\"></i>Log ud"
);


// Overview general
$("title").text("Redaktør | HTG-NYT");
$("h3").text("Skolebladet HTG-NYT");
$(".alert, br, .filter-toolbar").remove();

let newArticleButton = $(".admin-section-title .btn");
newArticleButton.text("+ Ny artikel");


// Immediate table changes (new columns w/ dates and buttons)
function addVisibilityButtons(row) {
	let visButton = $("<button></button>").addClass("btn vis-button");
	let wrapper = $("<div></div>").addClass("vis-buttons-wrapper");
	wrapper.appendTo($(row).find("td:eq(4)")).append(
		visButton.clone().text("Offentlig"),
		visButton.clone().text("Ikke offentlig"),
		//visibilityButton.clone().text("Deaktiveret") // No different
	);
	wrapper.children().eq($(row).hasClass("public") ? 0 : 1).addClass("current");

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

function addReadArticleButton(row, oldArticleUrl) {
	// Ugh...
	//let articlePath = $(row).find("td:eq(0)").text().trim().toLowerCase().replaceAll(" ", "_");
	let articleId = oldArticleUrl.match(/[\w_]+$/)[0];
	let articleUrl = `/artikel/${articleId}`;

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

$("#table thead tr:eq(0) th:eq(-1)").text("Handlinger").before("<th>Synlighed</th>");
$("#table thead tr:eq(1) th:eq(-1)").before("<th></th><th></th><th></th>");
$("#table tbody tr").each((_, row) => {
	let articleUuid = $(row).find(".edit-a").attr("href").match(/[\w\-]+$/)[0];
	$(row).attr("data-article-uuid", articleUuid);
	$(row).find("td:eq(-1)").before(`<td></td>`);

	addVisibilityButtons(row);

	let actionButtonsDiv = $("<div></div>").addClass("action-buttons-wrapper")
	$(row).find("td:eq(5)").append(actionButtonsDiv);
	let oldArticleUrl = $(row).find("td:eq(5) button.generate-link").attr("data-url");
	$(row).find("td:eq(5) button").remove();

	addReadArticleButton(row, oldArticleUrl);

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
			target: 0, render: (data, type, row) => {
				return data.replaceAll("⧸", "/");
			}
		}, {
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
					if (!data) {
						return type == "sort" ? 0 : (type == "filter" ? "" : "-");
					} else {
						return type == "display" || type == "filter" ? formatDate(new Date(parseInt(data, 10))) : data;
					}
				}, orderSequence: ["desc", "asc"]
		}, {
			target: 3, render: (data, type, row) => {
				let ctg = categories.find(ctg => ctg.uuid == data);
				if (data == "-" || !ctg) {
					return type == "sort" ? "末" : (type == "filter" ? "" : "-");
				} else if (type == "display") {
					return `<i class="fas fa-${ctg.icon}" aria-hidden="true"></i>&nbsp;&nbsp;${ctg.nav}`;
				} else if (type == "sort" || type == "filter") {
					return ctg.nav;
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
		if (column.search() != input.val()) {
			column.search(input.val()).draw();
		}
	});
	$(`<th class="tableSearch"></th>`).append(input).appendTo(searchFields);
}
searchFields.append("<th></th><th></th>");