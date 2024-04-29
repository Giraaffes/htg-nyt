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
	//{name: "Hovedmenu", icon: "house", href: "/hovedmenu"},
	{name: "Forside", icon: "newspaper", href: "/"},
	//{name: "Klassen", icon: "users", href: "/klassen"},
	//{name: "Udvalg", icon: "school", href: "/udvalg"},
	{name: "Redaktør", icon: "layer-group", href: "/redaktør"},
	//{name: "Min profil", icon: "user", href: "/profil"},
	{name: "Log ud", icon: "right-from-bracket", href: "/user/logout", addRedirect: true}
];
const loggedOutNavItems = [
	{name: "Log ind", icon: "right-to-bracket", href: "/login", addRedirect: false}, // perhaps no redirect is better
	//{name: "Registrer", icon: "user-plus", href: "/register/school-list/e9a"}
]

const addBackRedirects = (location.pathname == "/" || location.pathname.startsWith("/artikel/"));

function fixNavbar(nav) {
	nav.find(".language-container").remove();

	let loggedIn = (nav.find(".nav-item:contains(Log out)").length == 1);
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
$("#footer-section-2 h4:contains(Freelancers)").next().remove();
$("#footer-section-2 h4:contains(Freelancers)").remove();
$("#footer-section-2 h4:contains(Webudvkling)").text("Webudvikling"); // lol
$("#footer-section-2 a:contains(MEZZIO)").after("<p>Flap</p>");
$("#footer-section-2 p:contains(MEZZIO)").unwrap();

let redaktører = $("#footer-section-2 h4:eq(0)").nextUntil("#footer-section-2 h4:eq(1)");
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
const categories = [
	{
		oldName: "new", name: "nyt",
		icon: "newspaper", color: "green",
		title: "Aktuelt", nav: "Aktuelt",
		uuid: "c5d6bab2-fb97-11ed-a165-31ad61c0f3b8"
	}, {
		oldName: "faq", name: "sjovt", 
		icon: "face-laugh", color: "red",
		title: "Alt det sjove", nav: "Sjovt",
		uuid: "d0b44284-ab1d-11ee-9ea8-dd9b09e4a5f2"
	}, {
		oldName: "hack", name: "fagligt", 
		icon: "graduation-cap", color: "blue",
		title: "Faglige artikler", nav: "Fagligt",
		uuid: "b580e5a6-fed6-11ed-9071-2bb1f6a2097f"
	}, {
		oldName: "calendar", name: "aktiviteter", 
		icon: "calendar-alt", color: "grey",
		title: "Aktiviteter", nav: "Aktiviteter",
		uuid: "436a5cb2-f97d-11ed-801f-7963935a19ec"
	}, {
		oldName: "folk", name: "kantinen",
		icon: "utensils",  color: "yellow",
		title: "Kantinen", nav: "Kantinen",
		uuid: "354784a2-f97d-11ed-a06d-19a686eff9ad"
	}
];


// Used on front page, edit article
const tags = [
	{
		oldName: "interesse", name: "Anmeldelse", uuid: "54c8f716-6e4e-11ee-ad5d-9fefeab069e4"
	}, {
		oldName: "lær!", name: "Dansk", uuid: "aaacffe6-b51c-11ee-acb1-73422d5abbdf"
	}, {
		oldName: "debat", name: "Debat", uuid: "99b2fe06-53d5-11ed-8926-73863c277a61"
	}, {
		oldName: "strand", name: "Studietur", uuid: "a9e3e2b4-a88d-11ee-8e84-1717508ba037"
	}, {
		oldName: "fest", name: "Fest", uuid: "d8a148e2-03ad-11ee-89e4-5db8cafa4624"
	}, {
		oldName: "historie", name: "Historie", uuid: "11bd56c2-73f0-11ee-96eb-41e9459882a8"
	}, {
		oldName: "intro", name: "Hjælp", uuid: "1b62f78c-e9ac-11ed-9482-93b2538635b9"
	}, {
		oldName: "aktuelt", name: "Horoskop", uuid: "f2c4fff2-f953-11ed-8040-cdf0166f7e38"
	}, {
		oldName: "hygge", name: "Hygge", uuid: "62687fba-4520-11ee-a505-2b81ed688db0"
	}, {
		oldName: "eksistens", name: "Interview", uuid: "8a87ddf2-f943-11ed-af9f-4bd589f8f506"
	}, {
		oldName: "krea", name: "Krea", uuid: "8f1f9714-f953-11ed-97e4-0b7094f4f13c"
	}, {
		oldName: "kultur", name: "Kultur", uuid: "8723fd58-f943-11ed-b784-919d681a66b4"
	}, {
		oldName: "kunst", name: "Kunst", uuid: "3a8bf666-abb9-11ee-bea5-2912192b5cdd"
	}, {
		oldName: "fag", name: "Mat", uuid: "1d7c5672-d63b-11ee-b365-d5b04730348c"
	}, {
		oldName: "miljø", name: "Miljø", uuid: "a88a3ce6-f943-11ed-b0d6-816e5bb0ad8f"
	}, {
		oldName: "musik", name: "Musik", uuid: "365b995c-abb9-11ee-aced-bdec46c0e3c2"
	}, {
		oldName: "hall of fame", name: "Personale", uuid: "be17171a-70f2-11ee-945b-31d890db6297"
	}, {
		oldName: "politik", name: "Politik", uuid: "210034ba-73f0-11ee-9ad6-a5ed061629d6"
	}, {
		oldName: "valg", name: "Quiz", uuid: "2a8dea40-73f0-11ee-a9af-4db837035310"
	}, {
		oldName: "ord", name: "Rangliste", uuid: "3e425a10-c433-11ee-8a4d-4bdd1ad1cdae"
	}, {
		oldName: "samfund", name: "Samf", uuid: "a3618850-f943-11ed-9974-9fb5101cbeba"
	}, {
		oldName: "scene", name: "Samling", uuid: "07e50b4c-c024-11ee-8e34-974f719e5fbb"
	}, {
		oldName: "spil", name: "Spil", uuid: "bbeac660-f953-11ed-820b-fbdc7757ec5d"
	}, {
		oldName: "sport", name: "Sport", uuid: "e3347e2c-1f1a-11ee-b385-7924362cf0f1"
	}, {
		oldName: "sprog", name: "Sprog", uuid: "a1a957e4-f953-11ed-93a4-d14c49072c2b"
	}, {
		oldName: "sundhed", name: "Sundhed", uuid: "9ffb1604-f943-11ed-842f-4d2009fc944d"
	}, {
		oldName: "rejser", name: "Transport", uuid: "8210685c-b51c-11ee-a68f-c1ae82433707"
	}, {
		oldName: "tur", name: "Tur", uuid: "a6bd8cd2-f953-11ed-a85e-a97d26a26cee"
	}
];