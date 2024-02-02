let isChefredaktør = ($("input[name=\"status\"]").length > 0);
if (!isChefredaktør) throw Error("Ignorer denne fejl :)");


let skolebladNav = $(".sidebar .nav-item:first");
skolebladNav.html(skolebladNav.html().replace("htg-nyt", "læs htg-nyt"));
skolebladNav.find(".nav-link").attr("href", "/?type=new");

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


$(".alert").remove();

$("#title").on("keyup change clear", () => {
	$("title").text(`Rediger "${$("#title").val() || "[Unavngivet]"}"`);
}).trigger("change");

$("#magazines-articles-form").on("click", event => { // Helps to stop the page from mysteriously refreshing on button click
	event.stopPropagation();
});