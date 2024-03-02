// This page is really weird

$("title").text("Min profil | HTG-NYT");
$(".avatar-input").insertAfter("#preview-avatar");
$(".username").insertBefore("#preview-avatar");
$(".form-container div:last").css("height", "15px"); // Wtf??
$("#council-list p").each((_, p) => $(p).unwrap());
//$("div:has(> #address-input), div:has(> #email)").remove();
$(".icon-row").remove();
$(".profile-name + br").remove();

$(".profile-name").prepend("<h1>Mit navn</h1>");

$(".arrow-button")