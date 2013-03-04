define([
	'dojo/_base/declare',
	'dojo/json',
	'dojo/store/util/QueryResults',
	'dojo/store/util/SimpleQueryEngine',
	'./util/main'
], function (declare, JSON, queryResults, simpleQueryEngine, util) {

	var localStorage = window.localStorage;

	return declare(null, {
		// summary:

		// idProperty: String
		//		If the store has a single primary key, this indicates the property to use as the
		//		identity property. The values of this property should be unique.
		idProperty: 'id',

		// queryEngine: Function
		//		If the store can be queried locally (on the client side in JS), this defines
		//		the query engine to use for querying the data store.
		//		This takes a query and query options and returns a function that can execute
		//		the provided query on a JavaScript array. The queryEngine may be replace to
		//		provide more sophisticated querying capabilities. For example:
		//		| var query = store.queryEngine({foo:'bar'}, {count:10});
		//		| query(someArray) -> filtered array
		//		The returned query function may have a 'matches' property that can be
		//		used to determine if an object matches the query. For example:
		//		| query.matches({id:'some-object', foo:'bar'}) -> true
		//		| query.matches({id:'some-object', foo:'something else'}) -> false
		queryEngine: simpleQueryEngine,

		// name: String
		//		The name of this store, which will be used to derive key names so that multiple stores can co-exist
		//		together, with different names.
		name: '',

		// indexKey: String
		//		The name of the key for the "private" index of keys associated with this store
		indexKey: '__index',

		// index: Object
		//		The index of keys of items stored in relationship to this store name.
		index: null,

		constructor: function (options) {
			var data;
			for (var key in options) {
				if (key === 'data') {
					data = options[key];
				}
				else {
					this[key] = options[key];
				}
			}
			if (!this.name) {
				this.name = util.getUUID();
			}
			var indexString = localStorage.getItem([this.name, this.indexKey].join('.'));
			this.index = indexString ? JSON.parse(indexString) : {};
			if (data) {
				this.setData(data);
			}
		},

		get: function (id) {
			// summary:
			//		Retrieves an object by its identity
			// id: Number
			//		The identity to use to lookup the object
			// returns: Object
			//		The object in the store that matches the given id.
			return JSON.parse(localStorage.getItem(this.index[id]));
		},

		getIdentity: function (object) {
			// summary:
			//		Returns an object's identity
			// object: Object
			//		The object to get the identity from
			// returns: String
			return object[this.idProperty];
		},

		put: function (object, directives) {
			// summary:
			//		Stores an object
			// object: Object
			//		The object to store.
			// directives: dojo/store/api/Store.PutDirectives?
			//		Additional directives for storing objects.
			// returns: String
			var index = this.index,
				idProperty = this.idProperty,
				id = object[idProperty] = (directives && 'id' in directives) ? directives.id :
					idProperty in object ? object[idProperty] : util.getUUID();
			if (!(id in index)) {
				index[id] = [this.name, id].join('.');
				this.setIndex();
			}
			else if (directives && directives.overwrite === false) {
				// object exits, but shouldn't be overwritten
				throw new Error('Object already exists');
			}
			// add/update object
			localStorage.setItem(index[id], JSON.stringify(object));
			return id;
		},

		add: function (object, directives) {
			// summary:
			//		Creates an object, throws an error if the object already exists
			// object: Object
			//		The object to store.
			// directives: dojo/store/api/Store.PutDirectives?
			//		Additional directives for creating objects.
			// returns: Number|String
			(directives = directives || {}).overwrite = false;
			// call put with overwrite being false
			return this.put(object, directives);
		},

		remove: function (id) {
			// summary:
			//		Deletes an object by its identity
			// id: Number
			//		The identity to use to delete the object
			var index = this.index;
			if (id in index) {
				localStorage.removeItem(index[id]);
				delete index[id];
				this.setIndex();
				return true;
			}
		},

		query: function (query, options) {
			// summary:
			//		Queries the store for objects. This does not alter the store, but returns a
			//		set of data from the store.
			// query: String|Object|Function
			//		The query to use for retrieving objects from the store.
			// options: dojo/store/api/Store.QueryOptions
			//		The optional arguments to apply to the resultset.
			// returns: dojo/store/api/Store.QueryResults
			//		The results of the query, extended with iterative methods.
			//
			// example:
			//		Given the following store:
			//
			//	...find all items where 'prime' is true:
			//
			//	|	store.query({ prime: true }).forEach(function (object) {
			//	|		// handle each object
			//	|	});
			var data = [];
			for (var key in this.index) {
				data.push(JSON.parse(localStorage.getItem(this.index[key])));
			}
			return queryResults(this.queryEngine(query, options)(data));
		},

		setData: function (data) {
			// summary:
			//		Sets the given data as the source for this store, and indexes it
			// data: Object||Object[]
			//		An array of objects to use as the source of data.
			if (data.items) {
				// just for convenience with the data format IFRS expects
				this.idProperty = data.identifier;
				data = data.items;
			}
			this.clear();
			for (var i = 0; i < data.length; i++) {
				this.put(data[i]);
			}
		},

		setIndex: function () {
			// summary:
			//		A convenience function for "committing" the index for this instance of local storage
			localStorage.setItem([this.name, this.indexKey].join('.'), JSON.stringify(this.index));
		},

		clear: function () {
			// summary:
			//		Removes all the items from the store, it is the equivalent of localStorage.clear, but will only
			//		remove those items associated with this store.
			for (var key in this.index) {
				localStorage.removeItem(this.index[key]);
			}
			this.index = {};
			this.setIndex();
		}
	});

});