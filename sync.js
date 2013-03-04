define([
	'dojo/_base/declare',
	'dojo/Evented',
	'dojo/has',
	'dojo/json'
], function (declare, Evented, has, JSON) {

	has.add('es5-defineproperty', 'defineProperty' in Object);

	function createChangeRecord(type, object, generateDiff, oldObject) {
		// summary:
		//		Create a new change record and return it
		var changeRecord = {
			type: type,
			object: object,
			time: (new Date()).getTime()
		}
		if (generateDiff) {
			// perform diff on old object
		}
		return changeRecord;
	}

	function defaultCommitter(changeRecord) {
		// summary:
		//		The default committer which applies change records to the store
		var store = this.store,
			result;
		switch (changeRecord.type) {
		case 'put':
			break;
		case 'add':
			break;
		case 'get':
			break;
		case 'remove':
			break;
		}
		return result;
	}

	var SyncController = declare(null, {

		// pendingChangeRecords: []
		//		A FIFO queue of change records to be applied to the store
		pendingChangeRecords: null,

		// idMap: {}
		//		A hash that maps local ids
		idMap: null,

		// offline: Boolean
		//		If the current store is offline or not
		offline: false,

		store: null,

		// committer: Function
		//		The function that handles the application of the change record to the store.
		committer: defaultCommitter,

		// queryAdaptor: Function
		//		Allows the modification of queries before they are run against the store
		//		Signature: queryAdaptor(store, query, options)
		queryAdaptor: null,

		// expiration: Number
		//		The number of milliseconds an object is considered fresh, before it being treated as stale and being
		//		requested from further up the stack
		expiration: 60000,

		// removeExpired: Boolean
		//		Remove expired objects
		removeExpired: true,

		// removeExpiredInterval: Number
		//		The number of milliseconds between scans for stale objects
		removeExpiredInterval: 600000,

		constructor: function (store, options) {
			this.store = store;
			this.changeRecords = [];
			this.idMap = {};
		},

		idFactory: function (object) {

		},

		toString: function () {

		},

		toJson: function () {
			// summary:
			//		Serialisation routine...
		}
	});

	function addController(store, options) {
		// summary:
		//		Installs a SyncController on a store
		if (store && !store.__sync) {
			if (has('es5-defineproperty')) {
				Object.defineProperty(store, '__syncController', {
					value: new SyncController(options),
					configurable: true
				});
			}
			else {
				store.__syncController = new SyncController(options);
			}
		}
		return store;
	}

	/*
	 * The sync engine
	 *
	 * Events to be emitted:
	 *   `get`
	 *   `put`
	 *   `add`
	 *   `remove`
	 *   `query`
	 *   `offline`
	 *   `online`
	 *   `conflict`
	 *   `flush`
	 */
	var Sync = declare([Evented], {

		// stores: []
		//		An array of stores being managed by this Sync object
		stores: null,

		constructor: function (options) {
			this.stores = [];
		},

		/* The standard dojo/store public API */
		get: function (id) {

		},

		getIdentity: function (object) {

		},

		put: function (object, directives) {

		},

		add: function (object, directives) {

		},

		remove: function (id) {

		},

		query: function (query, options) {

		},

		/* Sync API */
		offline: function (stores) {
			// summary:
			//		Mark offline-able stores offline
			// stores: dojo/store/api/Store[]?
			//		An optional array of stores, to only mark specific ones
		},

		online: function (stores) {
			// summary:
			//		Mark offline-able stores online
			// stores: dojo/store/api/Store[]?
			//		An optional array of stores, to only mark specific ones
		},

		flush: function (options) {
			// summary:
			//		Flush any pending change records to stores
		},

		resolve: function (conflict) {
			// summary:
			//		Resolver function, that takes a conflict record and resolves the conflict by returning
			//		a change record that resolves the conflict.
		},

		idFactory: function (object) {
			// summary:
			//		Generate an ID for an object
		},

		/* Basics */
		toString: function () {

		},

		toJson: function () {
			// summary:
			//		Serialise the instance state in some fashion
		}
	});

	function sync(stores, options) {
		// summary:
		//		Synchronise an array of stores.
		// stores: dojo/store/api/Store[]
		//		An array of stores
		// options: syncOptions
		//		A hash of options
		// returns: Sync

		options = options || {};
		options.stores = stores;
		return new Sync(stores);
	}

	return sync;
});