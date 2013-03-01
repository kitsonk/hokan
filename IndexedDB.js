define([
	'dojo/_base/array',
	'dojo/_base/declare', // declare
	'dojo/_base/lang', // lang.hitch
	'dojo/Deferred',
	'dojo/Evented',
	'dojo/store/util/QueryResults',
	'dojo/when',
	'./idbQueryEngine',
	'./util'
], function (array, declare, lang, Deferred, Evented, queryResults, when, idbQueryEngine, util) {

	var idb = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

	return declare(Evented, {
		// summary:
		//		A store that provides an interface to an IndexedDB object store.  This is designed to allow the
		//		persistence of within the user agent as well as provide an interface that is fully compatible with the
		//		Dojo Store API.
		//
		//		Typical usage would be look this this:
		//		|	require(['hokan/IndexedDB], function (IndexedDB) {
		//		|		var store = new IndexedDB({
		//		|			name: 'store'
		//		|		});
		//		|
		//		|		store.ready.then(function () {
		//		|			store.add({
		//		|				id: 1,
		//		|				foo: 'bar'
		//		|			}).then(function (id) {
		//		|				store.get(id).then(function (item) {
		//		|					console.log(item);
		//		|				});
		//		|			});
		//		|		});
		//		|	});

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
		queryEngine: idbQueryEngine,

		// dbName: String
		//		This is the name of the database that this store should be located in.  Defaults to `default`.
		dbName: 'default',

		// name: String
		//		This is the name of the IndexedDB Object store that is used for this store.  Defaults to `default`.
		name: 'default',

		// version: Integer
		//		The version of the IndexedDB database, for user agents that support this feature
		version: 1,

		// autoOpen: Boolean
		//		Determines if the store should be automatically opened after construction or not.  Defaults to `true`.
		autoOpen: true,

		// ready: dojo/promise/Promise
		//		Set to a promise that is fulfilled when the store is open and ready for transactions.
		ready: null,

		// db: IDBDatabase
		//		Set to the IDBDatabase associated with the store when the database is open.
		db: null,

		constructor: function (options) {
			for (var key in options) {
				this[key] = options[key];
			}
			this.ready = new Deferred();
			if (this.autoOpen) {
				this.open();
			}
		},

		get: function (id) {
			// summary:
			//		Retrieves an object by its identity
			// id: Number|String
			//		The identity to use to lookup the object
			// returns: dojo/promise/Promise
			//		The object in the store that matches the given id.

			var self = this,
				dfd = new Deferred();
			
			var request = this.db.transaction(this.name).objectStore(this.name).get(id);
			request.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};
			request.onsuccess = function (event) {
				dfd.resolve(event.target.result);
			};

			return dfd.promise;
		},

		getIdentity: function (object) {
			// summary:
			//		Returns an object's identity
			// object: Object
			//		The object to get the identity from
			// returns: String|Number

			return object[this.idProperty];
		},

		put: function (object, directives) {
			// summary:
			//		Stores an object
			// object: Object
			//		The object to store.
			// directives: dojo/store/api/Store.PutDirectives?
			//		Additional directives for storing objects.
			// returns: dojo/promise/Promise

			var self = this,
				dfd = new Deferred(),
				idProperty = this.idProperty;
			
			object[idProperty] = (directives && 'id' in directives) ? directives.id :
				idProperty in object ? object[idProperty] : util.getUUID();

			var transaction = this.db.transaction([ this.name ], 'readwrite');
			transaction.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};

			transaction.objectStore(this.name).put(object).onsuccess = function (event) {
				// resolution of the promise in the same event loop can cause subsequent reads to receive the previous
				// version of the data (at least in some versions of Chrome) and until Dojo has Promises A+ we have to
				// frig it.
				setTimeout(function () {
					dfd.resolve(event.target.result);
				}, 0);
			};

			return dfd.promise;
		},

		add: function (object, directives) {
			// summary:
			//		Creates an object, throws an error if the object already exists
			// object: Object
			//		The object to store.
			// directives: dojo/store/api/Store.PutDirectives?
			//		Additional directives for creating objects.
			// returns: dojo/promise/Promise

			// TODO .add() and .put() could be re-factored into a single function
			var self = this,
				dfd = new Deferred(),
				idProperty = this.idProperty;

			// While it might be possible to use a key generator, most implementations of the key generator do not
			// generate UUIDs.  If the store is used in an "offline" situation, unique id's may not be generated,
			// therefore it is better, if the ID is not supplied, to generate a UUID instead.
			object[idProperty] = (directives && 'id' in directives) ? directives.id :
				idProperty in object ? object[idProperty] : util.getUUID();

			var transaction = this.db.transaction([ this.name ], 'readwrite');
			transaction.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};

			transaction.objectStore(this.name).add(object).onsuccess = function (event) {
				// resolution of the promise in the same event loop can cause subsequent reads to receive the previous
				// version of the data (at least in some versions of Chrome) and until Dojo has Promises A+ we have to
				// frig it.
				setTimeout(function () {
					dfd.resolve(event.target.result);
				}, 0);
			};

			return dfd.promise;
		},

		remove: function (id) {
			// summary:
			//		Deletes an object by its identity
			// id: Number|String
			//		The identity to use to delete the object

			var self = this,
				dfd = new Deferred();

			var request = this.db.transaction([ this.name ], 'readwrite').objectStore(this.name).delete(id);
			request.onerror = function (event) {
				self.emit('error', event);
				dfd.resolve(event);
			};
			request.onsuccess = function (event) {
				// resolution of the promise in the same event loop can cause subsequent reads to receive the previous
				// version of the data (at least in some versions of Chrome) and until Dojo has Promises A+ we have to
				// frig it.
				setTimeout(function () {
					self.emit('remove', event);
					dfd.resolve(event);
				});
			};

			return dfd.promise;
		},

		query: function (query, options) {
			// summary:
			//		Queries the store for objects. This does not alter the store, but returns a
			//		set of data from the store.
			// query: String|Object|Function
			//		The query to use for retrieving objects from the store.
			// options: dojo/store/api/Store.QueryOptions
			//		The optional arguments to apply to the result set.
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

			// TODO support keyRanges and indexes?
			var objectStore = this.db.transaction(this.name).objectStore(this.name);
			return queryResults(this.queryEngine(query, options)(objectStore));
		},

		open: function () {
			// summary:
			//		Open the database in order to prepare it to handle transactions
			// returns: dojo/promise/Promise
			//		A promise that is fulfilled with the IndexedDB when complete

			if (this.ready.isFulfilled() || this.isOpening) {
				throw new Error('Database being opened or already opening');
			}
			this.isOpening = true;
			var self = this,
				dfd = new Deferred();

			var request = idb.open(this.dbName, this.version);
			request.onerror = function (event) {
				dfd.reject(event);
			};
			request.onsuccess = function () {
				dfd.resolve(request.result);
			};
			request.onblocked = function (event) {
				self.emit('blocked', event);
			};
			request.onupgradeneeded = lang.hitch(this, this._onUpgradeNeeded);

			return dfd.then(function (db) {
				db.onerror = function (event) {
					self.emit('error', event);
				};
				delete self.isOpening;
				self.ready.resolve(self.db = db);
			}, function (error) {
				delete self.isOpening;
				self.emit('error', error);
				self.ready.reject(error);
			});
		},

		close: function () {
			// summary:
			//		Close the database so it will no longer take transactions
			if (this.db) {
				this.db.close();
				delete this.db;
				this.ready = new Deferred();
			}
		},

		clear: function () {
			// summary:
			//		Clear the store of any records
			// returns: dojo/promise/Promise
			//		A promise that is fulfilled with the IDBTransaction event relating to the clear

			var self = this,
				dfd = new Deferred();

			var request = this.db.transaction(this.name, 'readwrite').objectStore(this.name).clear();
			request.onsuccess = function (event) {
				self.emit('clear', event);
				dfd.resolve(event);
			};
			request.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};
			return dfd.promise;
		},

		removeStore: function () {
			// summary:
			//		Closes the database and removed the object store from the database
			// returns: dojo/promise/Promise
			//		A promise that is fulfilled with the transaction event relating to the store removal

			var self = this,
				dfd = new Deferred();

			if (this.db) {
				this.close();
			}
			var request = idb.open(self.dbName, self.version);
			request.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};
			request.onsuccess = function (event) {
				self.emit('removestore', event);
				request.result.close();
				dfd.resolve(true);
			};
			request.onupgradeneeded = function (event) {
				var db = event.currentTarget.result;
				if (db.objectStoreNames.contains(this.name)) {
					db.deleteObjectStore(this.name);
				}
			};

			return dfd.promise;
		},

		removeDb: function () {
			// summary:
			//		Closes the database if open and removes the database
			// returns: dojo/promise/Promise
			//		A promise that is fulfilled with the event related to the deleting of the database

			var self = this,
				dfd = new Deferred();

			if (this.db) {
				this.close();
			}
			var request = idb.deleteDatabase(this.dbName);
			request.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};
			request.onsuccess = function (event) {
				self.emit('deletedatabase', event);
				dfd.resolve(event);
			};

			return dfd.promise;
		},

		putData: function (data) {
			// summary:
			//		A convenience function that allows a "bulk" put of data in a single transaction to the object store.
			//		Any missing IDs will be generated and any duplicate IDs will be overwritten.
			// data: Object[]
			//		The array of objects to put in the store

			var self = this,
				dfd = new Deferred(),
				ids = [],
				idProperty = this.idProperty;

			var transaction = this.db.transaction([ this.name ], 'readwrite');
			transaction.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};
			transaction.oncomplete = function () {
				self.emit('putdata', ids);
				dfd.resolve(ids);
			};

			var objectStore = transaction.objectStore(this.name);

			var i, object;
			for (i = 0; i < data.length; i++) {
				object = data[i];
				// While it might be possible to use a key generator, most implementations of the key generator do not
				// generate UUIDs.  If the store is used in an "offline" situation, unique id's may not be generated,
				// therefore it is better, if the ID is not supplied, to generate a UUID instead.
				ids.push(object[idProperty] = idProperty in object ? object[idProperty] : util.getUUID());
				objectStore.put(object);
			}

			return dfd.promise;
		},

		addData: function (data) {
			// summary:
			//		A convenience function that allows a "bulk" add of data in a single transaction to the object store.
			//		Any missing IDs will be generated and any duplicated IDs will throw an exception.
			// data: Object[]
			//		The array of objects to add to the store

			// TODO: merge with putData
			var self = this,
				dfd = new Deferred(),
				ids = [],
				idProperty = this.idProperty;

			var transaction = this.db.transaction([ this.name ], 'readwrite');
			transaction.onerror = function (event) {
				self.emit('error', event);
				dfd.reject(event);
			};
			transaction.oncomplete = function () {
				self.emit('putdata', ids);
				dfd.resolve(ids);
			};

			var objectStore = transaction.objectStore(this.name);

			var i, object;
			for (i = 0; i < data.length; i++) {
				object = data[i];
				// While it might be possible to use a key generator, most implementations of the key generator do not
				// generate UUIDs.  If the store is used in an "offline" situation, unique id's may not be generated,
				// therefore it is better, if the ID is not supplied, to generate a UUID instead.
				ids.push(object[idProperty] = idProperty in object ? object[idProperty] : util.getUUID());
				objectStore.add(object);
			}

			return dfd.promise;
		},

		setData: function (data) {
			// summary:
			//		A convenience function that allows the data in the store to be replaced with the array of data in
			//		a single transaction.
			// data: Object[]
			//		The array of objects to replace the data in the store

			var self = this;
			return this.clear().then(function () {
				return self.putData(data);
			});
		},

		_onUpgradeNeeded: function (event) {
			// summary:
			//		The function that sets up the object store structure.  This could be overriden to implement
			//		a custom structure with indexes, or the 'upgradeneeded' event could be listened to in order
			//		to provide custom indexes on the object store.

			var db = event.currentTarget.result;
			if (!db.objectStoreNames.contains(this.name)) {
				db.createObjectStore(this.name, { keyPath: this.idProperty });
			}
			this.emit('upgradeneeded', event);
		}
	});
});