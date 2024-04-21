let onReadyHandlers = [];
let requestHooks = new Map();


function parseHookIdString(str) {
	let [ _, hookMethod, hookPath ] = str.match(/^(\w+) (.+)$/);
	hookMethod = hookMethod.toUpperCase();
	hookPath = hookPath.replaceAll("/", "\\/").replaceAll("*", "([\\w\\-_%.+!*'()]+)");
	return {
		method: hookMethod, 
		path: new RegExp(`^${hookPath}$`)
	};
}


// TODO better way of doing this probably
exports.register = function(moduleName) {
	let modulePath = `./modules/${moduleName}.js`;
	let { onReady: onReadyHandler, hooks: moduleRequestHooks } = require(modulePath);

	if (onReadyHandler) onReadyHandlers.push(onReadyHandler);
	
	for (let [ hookIdStr, hookFunction ] of moduleRequestHooks) {
		let hookId = parseHookIdString(hookIdStr);
		let hookFunctions = requestHooks.get(hookId) || [];
		hookFunctions.push(hookFunction);
		requestHooks.set(hookId, hookFunctions);
	} 
};

exports.ready = function(database) {
	for (let handler of onReadyHandlers) {
		handler(database);
	}
};

exports.callRequestHooks = async function(database, req, $) {
	for (let [ hookId, hookFunctions ] of requestHooks) {
		let hookPathMatch = req.path.match(hookId.path);
		if (hookPathMatch && req.method == hookId.method) {
			for (let hookFunc of hookFunctions) {
				await hookFunc(database, req, $, ...(hookPathMatch.slice(1)));
			}
		}
	}
};