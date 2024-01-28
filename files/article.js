let backToCategory = (new URL(window.location)).searchParams.get("backToCategory");
$(".arrow-button").removeAttr("onclick").attr("href", 
	`${location.origin}/?type=${backToCategory || "new"}`
);