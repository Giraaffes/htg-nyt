$(".authorContainer").insertAfter(".post-title");
$(".top-box h3").text($("title").text());
$("title").text(`Preview "${$(".post-title h2").text()}"`)

// No!!!!
$(".removeContent").remove();

// Fix embed
$(".style-socials").html($(".style-socials").text());

// And then I'd like to add a margin to the bottom but I just can't figure out how