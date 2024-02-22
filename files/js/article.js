// Title
let title = $(".post-title h2");
title.text(title.text().replaceAll("⧸", "/"));
$("title").text(title.text());


// Headline and subheadline (fix and activity dates)
function formatDate(date) {
	return {
		date: date.toLocaleString("da-DK", {day: "numeric", month: "long", year: "numeric"}),
		time: date.toLocaleString("da-DK", {timeStyle: "short"})
	};
}

let startDateElement = $("#supercool-htg-nyt-start-date");
let endDateElement = $("#supercool-htg-nyt-end-date");
if (startDateElement.length == 1 && endDateElement.length == 1) {
	let startDate = new Date(parseInt(startDateElement.val(), 10));
	let endDate = new Date(parseInt(endDateElement.val(), 10));
	
	let dateStr;
	let formattedStartDate = formatDate(startDate);
	let formattedEndDate = formatDate(endDate);
	if (formattedStartDate.date == formattedEndDate.date) {
		dateStr = `${formattedStartDate.date} // kl. ${formattedStartDate.time} - ${formattedEndDate.time}`;
	} else {
		dateStr = `${formattedStartDate.date} - ${formattedEndDate.date}`;
	}
	$("#subheadline").text(dateStr);
	//$(".post-title").css({"margin": "0", "text-align": "center"});
} else if (!$("#subheadline").text().trim()) {
	$("#subheadline").remove();
}


// Back button
let url_ = new URL(window.location);
let backToCategory = url_.searchParams.get("backToCategory");
$(".arrow-button").removeAttr("onclick").attr("href", 
	`${location.origin}/${backToCategory ? `?type=${backToCategory}` : ""}`
);


// Navbar
if ($(".navbar-nav").length == 0) {
	$(`
		<ul class="navbar-nav mr-auto">
			<li class="nav-item">
					<a class="nav-link" href="/login">Login</a>
			</li>
			<li class="nav-item">
					<a class="nav-link" href="/register/school-list/e9a?backTo=/">Register</a>
			</li>
		</ul>	
	`).appendTo("#mySidepanel"); // lmao why is it called mySidepanel
}


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


// Extra stuff
$("#contactModal button.close i").removeClass("fa-x").addClass("fa-xmark").css("font-size", "1.4rem");
$("#submitBtn").text("INDSEND")

$(() => {
	$("#submitBtn").off().on("click", async () => {
		let formData = new FormData($("#contact-form")[0]);
		let message = formData.get("contactMessage");
		formData.set("contactMessage", 
			`${message}\n\n(Kommentar til artiklen "${title.text()}" på ${location.origin + location.pathname})`
		);

		let res = await fetch("/contact/articleContact", {method: "POST", body: formData});
		let jsonRes = await res.json();

		if (jsonRes.status == "success") {
			$.notify("Kommentar indsendt!", "success");
			$("#contactModal").hide();
		} else {
			$.notify("Beskedfeltet må ikke være tomt", "error");
		}
	});
});