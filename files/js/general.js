// Top school name
$("#school-title").unwrap().text("Høje-Taastrup Gymnasium");


// Page icons
$("link[rel=apple-touch-icon]").attr("href", "/custom/img/icon_180.png");
$("link[rel=icon][sizes=32x32]").attr("href", "/custom/img/icon_32.png");
$("link[rel=icon][sizes=16x16]").attr("href", "/custom/img/icon_16.png");


// Navbar
function faIcon(iconName) {
	return `<i class=\"fas fa-${iconName}\" aria-hidden=\"true\"></i>`;
}

const loggedInNavItems = [
	{name: "Hovedmenu", icon: "house", href: "/hovedmenu"},
	{name: "Min profil", icon: "user", href: "/profil"},
	{name: "Klassen", icon: "users", href: "/klassen"},
	{name: "Udvalg", icon: "school", href: "/udvalg"},
	{name: "Redaktør", icon: "layer-group", href: "/redaktør"},
	{name: "Log ud", icon: "right-from-bracket", href: "/user/logout", addRedirect: true}
];
const loggedOutNavItems = [
	{name: "Log ind", icon: "right-to-bracket", href: "/login", addRedirect: true},
	//{name: "Registrer", icon: "user-plus", href: "/register/school-list/e9a"}
]

const addBackRedirects = (location.pathname == "/" || location.pathname.startsWith("/artikel/"));

function fixNavbar(nav) {
	nav.find(".language-container").remove();

	let loggedIn = (nav.find(".nav-item:contains(Log ud)").length == 1);
	let navBar = nav.find(".navbar-nav");
	navBar.children().remove();

	let navItems = loggedIn ? loggedInNavItems : loggedOutNavItems;
	for (let navItem of navItems) {
		let navElement = $("<li></li>").addClass("nav-item").appendTo(navBar);
		let navAnchor = $("<a></a>").addClass("nav-link").appendTo(navElement);
		navAnchor.attr("href", navItem.href);
		navAnchor.attr("draggable", "false");
		navAnchor.html(`${navItem.name}${faIcon(navItem.icon)}`);

		let addBackRedirect = (addBackRedirects && navItem.addRedirect);
		let paramStr = addBackRedirect ? `?backTo=${location.pathname}` : "";
		navAnchor.attr("href", navAnchor.attr("href").replace(/(?:\?.*)?$/, paramStr));
	}
}

$(() => {
	let nav = $(".navigation")
	if (nav.length == 1) fixNavbar(nav);
});


// Nav and back buttons
$(".openbtn").html("<i class=\"fas fa-bars\"></i>");
$(".arrow-button i").removeClass("fa-chevron-circle-left").addClass("fa-chevron-left");


// Footer
//$("#footer-section-2 h4:contains(Redaktion)").text("Redaktionen");
$("#footer-section-1 h4:first").text("Høje-Taastrup Gymnasium");
$("#footer-section-2 p:contains(Marie Ellitsgaard larsen)").text("Marie Ellitsgaard Larsen"); // lol
$("#footer-section-2 h4:contains(Freelancers), #footer-section-2 p:contains(-)").remove();
$("#footer-section-2 h4:contains(Webudvkling)").text("Webudvikling"); // lol
$("#footer-section-2 a:contains(MEZZIO)").after("<p>Flap</p>");
$("#footer-section-2 p:contains(MEZZIO)").unwrap();

let redaktører = $("#footer-section-2 h4:eq(0)").nextUntil("#footer-section-2 h4:eq(1)")
if (redaktører) {
	let sortedElements = redaktører.toArray().sort((a, b) => 
		$(a).text() < $(b).text() ? -1 : 1
	);
	$(sortedElements).insertAfter("#footer-section-2 h4:eq(0)");
}

$("#footer-logos img").slice(0, 4).remove();
$("#footer-logos").nextAll("br").remove();

if ($("#article-footer").length == 1) {
	$("body").append($("<div></div>").addClass("bgr-bottom"));
}


// General constants
// Used on front page, redaktør overview and edit article 
const categoryChanges = {
	"new": {
		oldTitle: "Nyt", name: "nyt", 
		icon: "newspaper", color: "green",
		title: "Aktuelt på HTG", nav: "Aktuelt"
	}, "faq": {
		oldTitle: "SERIØST..?", name: "sjovt", 
		icon: "face-laugh", color: "red",
		title: "Alt det sjove", nav: "Sjovt"
	}, "hack": {
		oldTitle: "Hacks", name: "fagligt", 
		icon: "graduation-cap", color: "blue",
		title: "Faglige artikler", nav: "Fagligt"
	}, /*"folk": {
		oldTitle: "Folk", name: "folk", 
		icon: "user", color: "yellow",
		title: "Folk", nav: "Folk"
	}, */"calendar": {
		oldTitle: "Kalender", name: "aktiviteter", 
		icon: "calendar-alt", color: "grey",
		title: "Aktiviteter", nav: "Aktiviteter"
	}
	//"meeting": {name: "kantinen", icon: "utensils", title: "Kantinen"} // ??
};

// Used on front page and edit article
const keepTags = [
	/*"intro", "aktuelt", */"debat", "kultur", "sundhed", "miljø", "krea", 
	"sprog", "tur", "spil", "fest", "sport", "hygge", "ferie", "historie",
	"politik", "kunst", "musik"
];
const tagChanges = {
	
	// random
	"interesse": "anmeldelse",
	"hall of fame": "personale",
	"eksistens": "interview",
	//"wtf": "useriøst",
	"valg": "quiz",
	"xpert": "lang",
	"rejser": "transport",
	"intro": "hjælp",
	"aktuelt": "horoskop",

	// Fag
	"lær!": "dansk",
	"samfund": "samf",
	"fag": "mat"
	// + historie^
};

// What??? so the "+" tag apparently means that you must be logged in to view the article