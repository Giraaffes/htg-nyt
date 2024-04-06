const mySQL = require('mysql2');

let isMySQLConnected = false;
let mySQLConn;


exports.connect = function(options) {
	return new Promise((res, rej) => {
		mySQLConn = mySQL.createConnection(options);
		mySQLConn.connect((err) => {
			if (err) {
				rej(err);
			} else {
				res();
			}
		});
	});
};

exports.isConnected = function() {
	return isMySQLConnected;
};

exports.queryDatabase = function(query) {
	return new Promise((res, rej) => {
		mySQLConn.query(query, (err, results, fields) => {
			if (err) {
				rej(err);
			} else {
				res({results, fields});
			}
		});
	});
}
