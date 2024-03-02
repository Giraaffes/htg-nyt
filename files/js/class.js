let className = $(".desc").text().match(/^[^\-]+/)[0].trim().toLowerCase();
$("title").text(`${className} | HTG-NYT`);
$(".classes-container > div > img").remove();
$(".classes-container > div:last").css("height", "20px"); // Wtf??
$(".check-toolbar").remove();

// lol
$(".class-students:contains(Test Person)").remove();
$(".class-students:contains(Test 2 Person)").remove();