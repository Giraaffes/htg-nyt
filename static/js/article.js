// Title
let title = $(".post-title h2");
title.text(title.text().replaceAll("⧸", "/"));
$("title").text(title.text());


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


// Allow html (sometimes)
$(".style-body p, .style-illustration p").each((_, e) => {
	$(e).html($(e).text());
});


// Extra stuff
/*$("#contactModal button.close i").removeClass("fa-x").addClass("fa-xmark").css("font-size", "1.4rem");
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
});*/


// Kantinen date remove
$(".authorContainer:contains(Af Kantinen På Htg) .date").remove();