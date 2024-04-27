// This page is really weird

$("title").text("Min profil | HTG-NYT");

$(".username").insertBefore("#preview-avatar");

$(".profile-name").prepend("<h1>Rediger navn</h1>");
$(".icon-row").remove();
$("#council-container").remove();

$(".profile-name + br").after(
	$(".avatar-input").prepend("<h1>Vælg profilbillede</h1>")
);

$(".green-submit-btn").removeClass("green-submit-btn").attr("id", "save-button").appendTo(
	$(".profile-name")
).text("Gem navn");

$(".form-container div:last").css("height", "15px"); // Wtf??

$(".modal-title").text("Beskær billedet");
$(".modal-footer button:contains(Cancel)").text("Annuller");