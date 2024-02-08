$(".authorContainer").insertAfter(".post-title");
$(".top-box h3").text("HTG-NYT");
$("title").text(`Preview "${$(".post-title h2").text()}"`)

// No!!!!
$(".removeContent").remove();

// Fix embed
$(".style-socials").html($(".style-socials").text());

// And then I'd like to add a margin to the bottom but I just can't figure out how

// Date
let dateElement = $("#supercool-htg-nyt-date");
if (dateElement.length == 1) {
	let date = new Date(parseInt(dateElement.val(), 10));
	let dateStr = date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric"});
	$(".authorDisName p").append(`<br><span class="date">${dateStr}</span>`);
}

// Allow html in paragraphs
$(".style-body p").each((_, e) => {
	$(e).html($(e).text());
});