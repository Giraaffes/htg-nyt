const mySQL = require('mysql2');

let isConnected = false;
let connection;


exports.connect = function(options) {
	return new Promise((res, rej) => {
		connection = mySQL.createConnection(options);
		connection.connect((err) => {
			if (err) {
				rej(err);
			} else {
				isConnected = true;
				res();
			}
		});
	});
};

exports.isConnected = function() {
	return isConnected;
};

function mySQLFormat(value) {
	if (typeof value == "number" || typeof value == "boolean") {
		return value;
	} else if (value instanceof Array) { // Assumes string values
		return `(${value.map(mySQLFormat).join(", ")})`;
	} else if (!value) {
		return "NULL";
	} else {
		return `"${value.toString().replaceAll("\"", "\\\"")}"`;
	}
}

exports.query = function(query, values) {
	let i = -1;
	query = query.replaceAll("?", () => {
		i++;
		return mySQLFormat(values[i]);
	});

	return new Promise((res, rej) => {
		connection.query(query, (err, results, fields) => {
			if (err) {
				rej(err);
			} else {
				res(results);
			}
		});
	});
}

exports.execute = function(query, values) {
	for (let i = 0; i < values.length; i++) { // I think this is necessary
		if (values[i] === undefined) values[i] = null;
	}

	return new Promise((res, rej) => {
		connection.query(query, values, (err, results, fields) => {
			if (err) {
				rej(err);
			} else {
				res(results);
			}
		});
	});
}