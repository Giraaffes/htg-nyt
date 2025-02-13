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
$("#footer-section-2 p:contains(Marius)").after("<p>Rebecca Eleonora Johannessen Fels</p>");
$("#footer-section-2 h4:contains(Freelancers)").next().remove();
$("#footer-section-2 h4:contains(Freelancers)").remove();
$("#footer-section-2 h4:contains(Webudvkling)").text("Webudvikling"); // lol
$("#footer-section-2 a:contains(MEZZIO)").after("<p>Flap</p>");
$("#footer-section-2 p:contains(MEZZIO)").unwrap();

$("#footer-section-2 p:contains(Rosalina)").remove();

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
		uuid: "11edfb97-c5d6-bab2-a165-31ad61c0f3b8"
	}, {
		oldName: "faq", name: "hygge", 
		icon: "face-laugh", color: "red",
		title: "Sjov og (u)hygge", nav: "Hygge",
		uuid: "11eeab1d-d0b4-4284-9ea8-dd9b09e4a5f2"
	}, {
		oldName: "hack", name: "fagligt", 
		icon: "graduation-cap", color: "blue",
		title: "Faglige artikler", nav: "Fagligt",
		uuid: "11edfed6-b580-e5a6-9071-2bb1f6a2097f"
	}, {
		oldName: "calendar", name: "aktiviteter", 
		icon: "calendar-alt", color: "grey",
		title: "Aktiviteter på HTG", nav: "Aktiviteter",
		uuid: "11edf97d-436a-5cb2-801f-7963935a19ec"
	}
];


// Used on front page, edit article
const tags = [
	{
		oldName: "interesse", name: "Anmeldelse", uuid: "11ee6e4e-54c8-f716-ad5d-9fefeab069e4"
	}, {
		oldName: "lær!", name: "Dansk", uuid: "11eeb51c-aaac-ffe6-acb1-73422d5abbdf"
	}, {
		oldName: "debat", name: "Konkurrence", uuid: "11ed53d5-99b2-fe06-8926-73863c277a61"
	}, {
		oldName: "strand", name: "Studietur", uuid: "11eea88d-a9e3-e2b4-8e84-1717508ba037"
	}, {
		oldName: "fest", name: "Fest", uuid: "11ee03ad-d8a1-48e2-89e4-5db8cafa4624"
	}, {
		oldName: "historie", name: "Historie", uuid: "11ee73f0-11bd-56c2-96eb-41e9459882a8"
	}, {
		oldName: "intro", name: "Hjælp", uuid: "11ede9ac-1b62-f78c-9482-93b2538635b9"
	}, {
		oldName: "aktuelt", name: "Horoskop", uuid: "11edf953-f2c4-fff2-8040-cdf0166f7e38"
	}, {
		oldName: "hygge", name: "Hygge", uuid: "11ee4520-6268-7fba-a505-2b81ed688db0"
	}, {
		oldName: "eksistens", name: "Interview", uuid: "11edf943-8a87-ddf2-af9f-4bd589f8f506"
	}, {
		oldName: "krea", name: "Krea", uuid: "11edf953-8f1f-9714-97e4-0b7094f4f13c"
	}, {
		oldName: "kultur", name: "Kultur", uuid: "11edf943-8723-fd58-b784-919d681a66b4"
	}, {
		oldName: "kunst", name: "Kunst", uuid: "11eeabb9-3a8b-f666-bea5-2912192b5cdd"
	}, {
		oldName: "fag", name: "Mat", uuid: "11eed63b-1d7c-5672-b365-d5b04730348c"
	}, {
		oldName: "miljø", name: "Miljø", uuid: "11edf943-a88a-3ce6-b0d6-816e5bb0ad8f"
	}, {
		oldName: "musik", name: "Musik", uuid: "11eeabb9-365b-995c-aced-bdec46c0e3c2"
	}, {
		oldName: "hall of fame", name: "Personale", uuid: "11ee70f2-be17-171a-945b-31d890db6297"
	}, {
		oldName: "politik", name: "Politik", uuid: "11ee73f0-2100-34ba-9ad6-a5ed061629d6"
	}, {
		oldName: "valg", name: "Quiz", uuid: "11ee73f0-2a8d-ea40-a9af-4db837035310"
	}, {
		oldName: "ord", name: "Rangliste", uuid: "11eec433-3e42-5a10-8a4d-4bdd1ad1cdae"
	}, {
		oldName: "samfund", name: "Samf", uuid: "11edf943-a361-8850-9974-9fb5101cbeba"
	}, {
		oldName: "scene", name: "Samling", uuid: "11eec024-07e5-0b4c-8e34-974f719e5fbb"
	}, {
		oldName: "spil", name: "Spil", uuid: "11edf953-bbea-c660-820b-fbdc7757ec5d"
	}, {
		oldName: "sport", name: "Sport", uuid: "11ee1f1a-e334-7e2c-b385-7924362cf0f1"
	}, {
		oldName: "sprog", name: "Sprog", uuid: "11edf953-a1a9-57e4-93a4-d14c49072c2b"
	}, {
		oldName: "sundhed", name: "Sundhed", uuid: "11edf943-9ffb-1604-842f-4d2009fc944d"
	}, {
		oldName: "rejser", name: "Transport", uuid: "11eeb51c-8210-685c-a68f-c1ae82433707"
	}, {
		oldName: "tur", name: "Tur", uuid: "11edf953-a6bd-8cd2-a85e-a97d26a26cee"
	}, {
		oldName: "udforsk!", name: "Natur", uuid: "11eeb51c-b50a-c9aa-9e66-73b940407b24"
	}, {
		oldName: "reporterne", name: "Reportage", uuid: "11eeb51a-f03a-2432-8448-1f36d397d0e6"
	}, {
		oldName: "lækkerier", name: "Opskrift", uuid: "11eeafa6-9c56-b2dc-af85-0b17f51c8368"
	}, {
		oldName: "talk", name: "Foredrag", uuid: "11eee5ec-57f2-71f4-83f8-87a53124b192"
	}, {
		oldName: "forstå", name: "Litteratur", uuid: "11eef0c8-61e9-f6fa-8867-73c1ccec8519"
	}, {
		oldName: "medier", name: "Film & Serier", uuid: "11ee7e54-f1cd-ab04-b10e-4bbb6cc5128d"
	}
];