$("title").text("Registrer | HTG-NYT");

$(".signingHeadline").text("Registrer ny bruger").after(
	$("<p>Send venligst ikke dette link til nogen andre :)</p>").addClass("subheadline")
);
$("h1:contains(Mangler din klasse eller årgang?)").closest("div").remove();
$(".schoolHeadline").text("Hvilken klasse går du i?");

$("#classForm label").toArray().sort((classLabel1, classLabel2) => 
	$(classLabel1).text() > $(classLabel2).text()
).forEach(classLabel => {
	let classInput = $(`input#${$(classLabel).attr("for")}`);
	$("#classForm").append(classInput).append(classLabel);
});

$("#classForm input").on("change", e => {
	location.href =`/registrer/${$(e.target).attr("value")}`;
});

$(".navigation").remove();