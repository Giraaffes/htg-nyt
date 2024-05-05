let onReadyCallbacks = [];
let routes = [];
let hooks = [];


exports.register = function(moduleName) {
	let modulePath = `./modules/${moduleName}.js`;
	let module = require(modulePath);

	if (module.onReadyCallback) onReadyCallbacks.push(module.onReadyCallback);
	routes.push(...module.routes)
	hooks.push(...module.hooks);
};

exports.ready = function(database) {
	for (let callback of onReadyCallbacks) {
		callback(database);
	}
};

exports.useRoutes = function(server, database) {
	for (let {method, path, callbacks} of routes) {
		let middleCallbacks = callbacks.slice(0, -1);
		let mainCallback = callbacks[callbacks.length - 1];
		server[method.toLowerCase()](
			path, ...middleCallbacks, 
			mainCallback.bind(null, database)
		);
	}
}

exports.useHooks = function(server, database) {
	for (let {method, path, callback} of hooks) {
		server[method.toLowerCase()](path, async (req, res, next) => {
			let redirectUrl = res.locals.inspirRes.headers.location; // TODO should it be like this?
			if (!(req.method == "GET" && redirectUrl)) {
				await callback(database, req, res.locals.$ || null);
			}
			next();
		});
	}
}


exports.Module = class {
	onReadyCallback;
	routes = [];
	hooks = [];

	onReady(callback) {
		this.onReady = callback;
	}

	route(method, path, ...callbacks) {
		this.routes.push({method, path, callbacks});
	}

	hook(method, path, callback) {
		this.hooks.push({method, path, callback});
	}
};