$("title").text("Registrer | HTG-NYT");

$("h1:contains(PIN CODE)").text("Opret ny bruger");
$("p:contains(Create pin code for later logins)").text("Husk din kode :)");
$("input[name=email]").attr("placeholder", "Email");

$("div:has(> input[name=password])").children().unwrap();
$("input[name=password]").attr("placeholder", "Kode (4-cifret)").removeClass();
$("input[name=passwordConfirm]").attr("placeholder", "Gentag kode").removeClass();