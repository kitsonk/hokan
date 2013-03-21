define([
	'dojo/_base/array'
], function (array) {

	function isObjectEmpty(O) {
		// summary:
		//		Detects if an Object is "empty" in that it has no enumerable own keys.
		// O: Object
		//		The Object to insect
		// returns: Boolean
		//		Returns `false` if it is not empty or `true` if it is

		for (var key in O) {
			if (O.hasOwnProperty(key)) {
				return false;
			}
		}
		return true;
	}

	function simpleArrayDiff(a, b) {
		// summary:
		//		Compares two array that should only contain primitives.  It returns the difference between the two
		//		arrays or `undefined` if there is no difference.  The comparison looks for presence of the primitive
		//		and does not care about the order.  If there are differences, an Array is returned.  It will contain
		//		one or two arguments that are Objects that contain the values either added or deleted when compared
		//		to the second array.
		// a: Array
		//		The array to serve as the baseline
		// b: Array
		//		The array to to serve as the comparison.  If items are present in this array that aren't in array `a`
		//		they will be returned as `{ type: 'add', value: [...] }` and items present in `a` but not present in this
		//		array will be returned as `{ type: 'delete', value: [...] }`
		// returns: [ Object... ] || undefined

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
		//		same order.  The array returned will be a sparse array, with only the elements of the array that are
		//		different.
		// a: Array
		//		The array to serve as the baseline.
		// b: Array
		//		The array to serve as the comparison.
		// returns: Array || undefined
		//		The array of the changes

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
		// summary:
		//		Compares two arrays and returns the difference.  It handles primitive only arrays or arrays that contain
		//		non-primitives differently.  Primitive only arrays return either `undefined` or an array with one or two
		//		elements which represent that differences between arrays.  If an array contains a non-primitive, it
		//		compares the elements in the array in the order they appear in the array, returning any elements that
		//		differ.
		// a: Array
		//		The array that serves as baseline.
		// b: Array
		//		The array to serve as the comparison.
		// returns: Array || undefined
		//		The array of changes.

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
		// summary:
		//		Provide a difference between two objects, where any key of the object are returned with information
		//		on how they changed, with a `type` of: 'delete', 'change' or 'add' and `value` that represents that
		//		new value, which can in turn be another object difference.  This does a deep comparison, where if the
		//		a property !== compared property, it will introspect both values and compare them.
		// a: Object
		//		The object that serves as baseline.
		// b: Object
		//		The object to serve as the comparison.
		// returns: Object || undefined
		//		The object of changes, or undefined if none.

		function diffValues(aValue, bValue) {
			var dKey;
			if (aValue !== bValue) {
				if (bValue === undefined) {
					dKey = {
						type: 'delete'
					};
				}
				else if (aValue !== null && typeof aValue === 'object') {
					// typeof null === 'object', but want to treat as primitive
					var dValue = diff(aValue, bValue);
					if (dValue !== undefined) {
						dKey = {
							type: 'change',
							value: dValue
						};
					}
				}
				else {
					dKey = {
						type: 'change',
						value: bValue
					};
				}
			}
			return dKey;
		}

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
		var key, dValue, d = {};
		for (key in a) {
			if (a.hasOwnProperty(key)) {
				if (!(key in b)) {
					d[key] = {
						type: 'delete'
					};
				}
				else {
					dValue = diffValues(a[key], b[key]);
					if (dValue) {
						d[key] = dValue;
					}
				}
			}
		}
		for (key in b) {
			if (b.hasOwnProperty(key) && !(key in a)) {
				d[key] = {
					type: 'add',
					value: b[key]
				};
			}
		}
		return isObjectEmpty(d) ? undefined : d;
	}

	function diff(a, b) {
		// summary:
		//		Compare two arguments, returning the differences between the two.
		// a: Any
		//		The item that serves as baseline
		// b: Any
		//		The item that is used for comparison
		// returns: Object || Array || undefined
		//		Returns `undefined` if there is no difference between the two arguments

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