// Title
$("title").text($(".post-title h2").text());


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