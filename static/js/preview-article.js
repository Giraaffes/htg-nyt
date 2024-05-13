$(".authorContainer").insertAfter(".post-title");
$(".top-box h3").text("HTG-NYT");

let title = $(".post-title h2");
title.text(title.text().replaceAll("⧸", "/"));
$("title").text(`Preview "${title.text()}"`);

// No!!!!
$(".removeContent").remove();

// Fix embed
$(".style-socials").html($(".style-socials").text());

// Date
let dateElement = $("#supercool-htg-nyt-date");
if (dateElement.length == 1) {
	let date = new Date(parseInt(dateElement.val(), 10));
	let dateStr = date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric"});
	$(".authorDisName p").append(`<br><span class="date">${dateStr}</span>`);
}

// Allow html (sometimes)
$(".style-body p, .style-illustration p").each((_, e) => {
	$(e).html($(e).text());
});