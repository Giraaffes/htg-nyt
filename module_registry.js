let onReadyHandlers = [];
let pageHooks = [];
let redirectHooks = [];
let routers = [];


exports.register = function(moduleName) {
	let modulePath = `./modules/${moduleName}.js`;
	let { onReady, pageHook, router } = require(modulePath);

	if (onReady) onReadyHandlers.push(onReady);
	if (pageHook) pageHooks.push(pageHook);
	if (router) routers.push(router);
};

exports.ready = function(database) {
	for (let handler of onReadyHandlers) {
		handler(database);
	}
};

exports.callPageHooks = async function(req, $) {
	for (let pageHook of pageHooks) {
		await pageHook(req, $);
	}
};

exports.callRedirectHooks = function(req, redirectUrl, params) {
	for (let redirectHook of redirectHooks) {
		redirectHook(req, redirectUrl, params);
	}
}

exports.addRouters = function(server) {
	for (let router of routers) {
		server.use("/", router);
	}
};