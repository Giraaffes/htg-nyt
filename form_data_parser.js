const multipart = require('parse-multipart-data');

exports.parse = function(req) {
	let [ _, multipartBoundary ] = req.headers["content-type"].match(/boundary=(.+)$/);
	let parts = multipart.parse(req.body, multipartBoundary);

	let formData = {};
	for (let part of parts) {
		let indices = part.name.match(/[^\[\]]+/g);

		let parentObject = formData;
		for (let index of indices.slice(0, -1)) {
			if (!parentObject[index]) parentObject[index] = {};
			parentObject = parentObject[index];
		}
		let lastIndex = indices[indices.length - 1];

		if (!part.type) part.data = part.data.toString("utf8");
		if (part.name.endsWith("[]")) {
			if (!parentObject[lastIndex]) parentObject[lastIndex] = [];
			parentObject[lastIndex].push(part.data);
		} else {
			parentObject[lastIndex] = part.data;
		}
	}
	return formData;
}