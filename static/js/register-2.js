$("title").text("Registrer | HTG-NYT");

$("h1:first").text("Opret ny bruger").next().text("Husk din kode :)");

$("input[name=email]").attr("placeholder", "Email");

$("div:has(> input[name=password])").children().unwrap();
$("input[name=password]").attr("placeholder", "Kode (4-cifret)").removeClass();
$("input[name=passwordConfirm]").attr("placeholder", "Gentag kode").removeClass();


const errorTranslations = {
	"The email address has already been used once": "Denne email er allerede i brug",
	"The two PIN codes are not the same": "Du har skrevet to forskellige koder",
	"First Name is required and cannot be empty": "Du skal skrive et fornavn",
	"Last Name is required and cannot be empty": "Du skal skrive et efternavn",
	"E-mail address is required and cannot be empty": "Du skal skrive en email-addresse",
	"Password is required and cannot be empty": "Du skal skrive en kode",
	"Confirm Password is required and cannot be empty": "Du skal gentage din kode"
}

let errorBox = $(".alert-danger");
if (errorBox.length == 1) {
	let originalError = errorBox.find("li:first").text();
	let newError = errorTranslations[originalError];
	$.notify(
		`Fejl: ${newError || `"${originalError}"`}`,
		{autoHide: false}
	);
	errorBox.remove();
}