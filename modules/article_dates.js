const express = require("express");


let database;

exports.onReady = ((database_) => {
	database = database_;
});


