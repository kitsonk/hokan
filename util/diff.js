define([
	'dojo/_base/array'
], function (array) {

	function isObjectEmpty(O) {
		for (var key in O) {
			if (O.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	}

	function simpleArrayDiff(a, b) {
		var del = array.filter(a, function (i) {
			return !~b.indexOf(i);
		});
		var add = array.filter(b, function (i) {
			return !~a.indexOf(i);
		});
		var d = [];
		if (del.length) {
			d.push({
				type: 'delete',
				value: del
			});
		}
		if (add.length) {
			d.push({
				type: 'add',
				value: add
			});
		}
		return d.length ? d : undefined;
	}

	function complexArrayDiff(a, b) {
		// summary:
		//		This compares two arrays and returns the difference when the arrays contain non-primitives.  Because
		//		of the complexity of non-primitives, the assumption is made that elements of the array appear in the
		//		same order.  The array returned will be a sparse array.
		var iDiff, bValue, d = [];
		array.forEach(a, function (aValue, idx) {
			if (idx < b.length) {
				bValue = b[idx];
				if (aValue === undefined && bValue !== undefined) {
					d[idx] = {
						type: 'add',
						value: bValue
					};
				}
				if (aValue !== bValue) {
					iDiff = diff(aValue, bValue);
					if (iDiff) {
						d[idx] = {
							type: 'change',
							value: iDiff
						};
					}
				}
			}
			else {
				d[idx] = {
					type: 'delete'
				};
			}
		});
		if (b.length > a.length) {
			for (var i = a.length; i < b.length; i++) {
				bValue = b[i];
				if (bValue !== undefined) {
					d[i] = {
						type: 'add',
						value: bValue
					};
				}
			}
		}
		return d.length ? d : undefined;
	}

	function arrayDiff(a, b) {
		if (b === undefined) {
			return {
				type: 'delete'
			};
		}
		if (!(b instanceof Array)) {
			return {
				type: 'change',
				value: b
			};
		}
		var primitivesOnly = array.every(a.concat(b), function (item) {
			return item === null || typeof item !== 'object';
		});
		if (primitivesOnly) {
			return simpleArrayDiff(a, b);
		}
		return complexArrayDiff(a, b);
	}

	function objectDiff(a, b) {
		if (b === undefined) {
			return {
				type: 'delete'
			};
		}
		if (!b || typeof b !== 'object') {
			return {
				type: 'change',
				value: b
			};
		}
		var key, aValue, bValue, dValue, d = {};
		for (key in a) {
			if (a.hasOwnProperty(key)) {
				if (!(key in b)) {
					d[key] = {
						type: 'delete'
					};
				}
				else {
					aValue = a[key];
					bValue = b[key];
					if (aValue !== bValue) {
						if (bValue === undefined) {
							d[key] = {
								type: 'delete'
							};
						}
						else if (aValue !== null && typeof aValue === 'object') {
							// typeof null === 'object', but want to treat as primitive
							dValue = diff(aValue, bValue);
							if (dValue !== undefined) {
								d[key] = {
									type: 'change',
									value: dValue
								};
							}
						}
						else {
							d[key] = {
								type: 'change',
								value: bValue
							};
						}
					}
				}
			}
		}
		for (key in b) {
			if (!(key in a)) {
				d[key] = {
					type: 'add',
					value: b[key]
				};
			}
		}
		return isObjectEmpty(d) ? undefined : d;
	}

	function diff(a, b) {
		if (a === undefined) {
			if (b === a) {
				return undefined;
			}
			return {
				type: 'add',
				value: b
			};
		}
		if (a === null || a === Infinity || typeof a === 'string' || typeof a === 'number'
				|| typeof a === 'boolean') {
			if (a === b) {
				return undefined;
			}
			if (b === undefined) {
				return {
					type: 'delete'
				};
			}
			return {
				type: 'change',
				value: b
			};
		}
		if (a instanceof Array) {
			return arrayDiff(a, b);
		}
		if (typeof a === 'object') {
			return objectDiff(a, b);
		}
		throw new TypeError('Unrecognized type of object passed.');
	}

	diff.array = arrayDiff;
	diff.object = objectDiff;

	return diff;
});