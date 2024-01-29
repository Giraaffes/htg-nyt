$("#footer-section-1 h4:first").text("Høje-Taastrup Gymnasium");

let redaktører = $("#footer-section-2 h4:eq(0)").nextUntil("#footer-section-2 h4:eq(1)")
if (redaktører) {
	let sortedElements = redaktører.toArray().sort((a, b) => 
		$(a).text() < $(b).text() ? -1 : 1
	);
	$(sortedElements).insertAfter("#footer-section-2 h4:eq(0)");
}


const navItems = {
	"Min profil": {name: "Min profil", icon: "user"},
	"Klassen": {name: "Klassen", icon: "school"},
	"Cirkler": {name: "Udvalg", icon: "users"},
	"Log ud": {name: "Log ud", icon: "right-from-bracket"},
	"Login": {name: "Log ind", icon: "right-to-bracket"},
	"Register": {name: "Registrer", icon: "user-plus"}
};

const loggedInNavItems = [
	{name: "Hovedmenu", icon: "house", href: "/hovedmenu", pos: 0},
	{name: "Redaktør", icon: "layer-group", href: "/editor", pos: 4}
]

let nav = $(".navigation")
if (nav.length == 1) {
	nav.find(".language-container").remove();
	nav.find("a:contains(Vidensbanken), a:contains(Revolution)").closest(".nav-item").remove();
	//nav.find("a:contains(Login)").text("Log ind");
	//nav.find("a:contains(Register)").text("Registrer");

	nav.find(".nav-item a").each((_, a) => {
		let name = $(a).text();
		let navItem = navItems[name];
		if (navItem) {
			$(a).text(navItem.name);

			let icon = $(`<i class="fa-solid fa-${navItem.icon}"></i>`);
			icon.css({"width": "25px", "margin-left": "10px", "font-size": "70%", "text-align": "center"});
			if (navItem.icon == "right-to-bracket") icon.css({"font-size": "80%", "width": "30px", "margin-left": "5px"});
			$(a).append(icon);
		} else {
			$(a).remove();
		}
	});

	let logoutNav = nav.find(".nav-item:contains(Log ud)");
	if (logoutNav.length == 1) {
		for (let navItem of loggedInNavItems) {
			let newNav = logoutNav.clone().insertBefore(nav.find(".nav-item").eq(navItem.pos));
			newNav.html(newNav.html().replace("Log ud", navItem.name));
			newNav.find("i").removeClass("fa-right-from-bracket").addClass(`fa-${navItem.icon}`);
			newNav.find("a").attr("href", navItem.href);
		}
	} else {
		nav.find(".nav-item:contains(Log ind) a").attr("href", "/login"); // Remove backTo parameter
	}
}

$(".arrow-button i").removeClass("fa-chevron-circle-left").addClass("fa-chevron-left");