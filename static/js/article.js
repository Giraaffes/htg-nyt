// (R) Title
let title = $(".post-title h2");
title.text(title.text().replaceAll("⧸", "/"));
$("title").text(title.text());


// (O) Back button
let url_ = new URL(window.location);
let backToCategory = url_.searchParams.get("backToCategory");
$(".arrow-button").removeAttr("onclick").attr("href", 
	`${location.origin}/${backToCategory ? `?type=${backToCategory}` : ""}`
);


// (Y) Navbar
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


// (_) Allow html (sometimes)
$(".style-body p, .style-illustration p, .style-answer p").each((_, e) => {
	$(e).html($(e).text());
});


// (_) Subheading ids
$(".style-middle-heading").each((_, e) => {
	$(e).attr("id", $(e).text().toLowerCase().trim().replace(/\s+/, "-"));
});
$(document).ready(() => {
	if (window.location.hash) {
		window.scrollTo($(window.location.hash)[0]);
		window.scrollBy(0, -70);
	}
});


// (_) Kantinen date remove
$(".authorContainer:contains(Af Kantinen På Htg) .date").remove();


// (_) Stopped working T_T
$(".authorImage").remove();


// (G) OG headers
$("head").append(`
<meta property="og:title" content="${title.text()}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${url_.origin}${url_.pathname}" />
<meta property="og:image" content="https://htgnyt.dk/thumbnail/${ARTICLE_UUID}_${THUMBNAIL_VERSION}.png" />
<meta property="og:site_name" content="HTG-NYT" />
`);