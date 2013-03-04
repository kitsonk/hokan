define([
	'dojo/Deferred'
], function (Deferred) {
	// module:
	//		hokan/idbQueryEngine
	
	return function (query, options) {

		switch (typeof query) {
		case 'object':
		case 'undefined':
			var queryObject = query;
			query = function (object) {
				for (var key in queryObject) {
					var required = queryObject[key];
					if (required && required.test) {
						// an object can provide a test method, which makes it work with regex
						if (!required.test(object[key], object)) {
							return false;
						}
					}
					else if (required != object[key]) {
						return false;
					}
				}
				return true;
			};
			break;
		case 'string':
			// named query
			if (!this[query]) {
				throw new Error('No filter function ' + query + ' was found in store');
			}
			query = this[query];
			break;
		case 'function':
			break;
		default:
			throw new Error('Can not query with a ' + typeof query);
		}

		function execute(objectStore) {
			var dfd = new Deferred(),
				results = [],
				cursor;

			objectStore.openCursor().onsuccess = function (event) {
				cursor = event.target.result;
				if (cursor) {
					if (query(cursor.value)) {
						results.push(cursor.value);
					}
					cursor.continue();
				}
				else {
					dfd.resolve(results);
				}
			};

			return dfd.then(function (results) {
				// sort results
				var sortSet = options && options.sort;
				if (sortSet) {
					results.sort(typeof sortSet === 'function' ? sortSet : function (a, b) {
						for (var sort, i = 0; sort = sortSet[i]; i++) {
							var aValue = a[sort.attribute],
								bValue = b[sort.attribute];
							if (aValue !== bValue) {
								return !!sort.descending === (aValue === null || aValue > bValue) ? -1 : 1;
							}
						}
						return 0;
					});
				}
				// paginate results
				if (options && (options.start || options.count)) {
					var total = results.length;
					results = results.slice(options.start || 0, (options.start || 0) + (options.count || Infinity));
					results.total = total;
				}
				return results;
			});
		}
		execute.matches = query;

		return execute;
	};
});