define([
	'doh/main',
	'dojo/promise/all',
	'dojo/when',
	'../IndexedDB'
], function (doh, all, when, IndexedDB) {
	var storage = new IndexedDB({
		dbName: 'temp',
		name: 'storage'
	});

	doh.register('tests.IndexedDB', [
		{
			name: 'setup',
			runTest: function (t) {
				var td = new doh.Deferred();
				when(storage.ready).then(function () {
					storage.clear().then(function () {
						var puts = [];
						puts.push(storage.put({id: 1, name: 'one', prime: false, mappedTo: 'E'}));
						puts.push(storage.put({id: 2, name: 'two', even: true, prime: true, mappedTo: 'D'}));
						puts.push(storage.put({id: 3, name: 'three', prime: true, mappedTo: 'C'}));
						puts.push(storage.put({id: 4, name: 'four', even: true, prime: false, mappedTo: null}));
						puts.push(storage.put({id: 5, name: 'five', prime: true, mappedTo: 'A'}));
						all(puts).then(td.getTestCallback(function (ids) {
							t.is(ids, [ 1, 2, 3, 4, 5 ]);
						}));
					});
				});
				return td;
			}
		}, {
			name: 'get',
			runTest: function (t) {
				var td = new doh.Deferred(),
					gets = [];

				gets.push(storage.get(1));
				gets.push(storage.get(4));
				gets.push(storage.get(5));
				all(gets).then(td.getTestCallback(function (results) {
					t.is(results[0].name, 'one');
					t.is(results[1].name, 'four');
					t.t(results[2].prime);
				}));

				return td;
			}
		}, {
			name: 'query',
			runTest: function (t) {
				var td = new doh.Deferred(),
					queries = [];

				queries.push(storage.query({ prime: true }));
				queries.push(storage.query({ even: true }));
				all(queries).then(td.getTestCallback(function (results) {
					t.is(results[0].length, 3);
					t.is(results[1][1].name, 'four');
				}));
				
				return td;
			}
		}, {
			name: 'query with string',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.query({ name: 'two' }).then(td.getTestCallback(function (results) {
					t.is(results.length, 1);
					t.is(results[0].name, 'two');
				}));
				
				return td;
			}
		}, {
			name: 'query with RegExp',
			runTest: function (t) {
				var td = new doh.Deferred(),
					queries = [];

				queries.push(storage.query({ name: /^t/ }));
				queries.push(storage.query({ name: /^o/ }));
				queries.push(storage.query({ name: /o/ }));
				all(queries).then(td.getTestCallback(function (results) {
					t.is(results[0].length, 2);
					t.is(results[0][1].name, 'three');
					t.is(results[1].length, 1);
					t.is(results[2].length, 3);
				}));
				
				return td;
			}
		}, {
			name: 'query with test function',
			runTest: function (t) {
				var td = new doh.Deferred(),
					queries = [];

				queries.push(storage.query({ id: { test: function (id) { return id < 4; } } }));
				queries.push(storage.query({ even: { test: function (even, object) { return even && object.id > 2; } } }));
				all(queries).then(td.getTestCallback(function (results) {
					t.is(results[0].length, 3);
					t.is(results[1].length, 1);
				}));
				
				return td;
			}
		}, {
			name: 'query with sort',
			runTest: function (t) {
				var td = new doh.Deferred(),
					queries = [];

				queries.push(storage.query({ prime: true }, { sort: [ { attribute: 'name' } ] }));
				queries.push(storage.query({ even: true }, { sort: [ { attribute: 'name' } ] }));
				queries.push(storage.query({ even: true }, { sort: function (a, b) {
					return a.name < b.name ? -1 : 1;
				}}));
				queries.push(storage.query(null, { sort: [{ attribute: 'mappedTo' } ] }));
				all(queries).then(td.getTestCallback(function (results) {
					t.is(results[0].length, 3);
					t.is(results[1][1].name, 'two');
					t.is(results[2][1].name, 'two');
					t.is(results[3][4].name, 'four');
				}));
				
				return td;
			}
		}, {
			name: 'query with paging',
			runTest: function (t) {
				var td = new doh.Deferred(),
					queries = [];

				queries.push(storage.query({ prime: true }, { start: 1, count: 1 }));
				queries.push(storage.query({ even: true }, { start: 1, count: 1 }));
				all(queries).then(td.getTestCallback(function (results) {
					t.is(results[0].length, 1);
					t.is(results[1][0].name, 'four');
				}));
				
				return td;
			}
		}, {
			name: 'put update',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.get(4).then(function (four) {
					four.square = true;
					storage.put(four).then(function () {
						storage.get(4).then(td.getTestCallback(function (four) {
							t.t(four.square);
						}));
					});
				});

				return td;
			}
		}, {
			name: 'put new',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.put({
					id: 6,
					perfect: true
				}).then(td.getTestCallback(function () {
					storage.get(6).then(function (six) {
						t.t(six.perfect);
					});
				}));
				
				return td;
			}
		}, {
			name: 'add duplicate',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.add({
					id: 6,
					perfect: true
				}).otherwise(td.getTestCallback(function (event) {
					// Promise gets rejected with an error
					t.t(event.target.error);
				}));

				return td;
			}
		}, {
			name: 'add new',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.add({
					id: 7,
					prime: true
				}).then(function () {
					storage.get(7).then(td.getTestCallback(function (seven) {
						t.t(seven.prime);
					}));
				});

				return td;
			}
		}, {
			name: 'remove',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.remove(7).then(function (result) {
					storage.get(7).then(td.getTestCallback(function (item) {
						t.is(result.type, 'success');
						t.is(item, undefined);
					}));
				});

				return td;
			}
		}, {
			name: 'remove missing',
			runTest: function (t) {
				var td = new doh.Deferred();

				storage.remove(77).then(function (result) {
					storage.get(1).then(function (one) {
						storage.query().then(td.getTestCallback(function (query) {
							t.is(result.type, 'success');
							t.is(one.id, 1);
							t.is(query.length, 6);
						}));
					});
				});

				return td;

			}
		}, {
			name: 'query after changes',
			runTest: function (t) {
				var td = new doh.Deferred(),
					queries = [];

				queries.push(storage.query({ prime: true }));
				queries.push(storage.query({ perfect: true }));
				all(queries).then(td.getTestCallback(function (results) {
					t.is(results[0].length, 3);
					t.is(results[1].length, 1);
				}));

				return td;
			}
		}, {
			name: 'add new ID assignment',
			runTest: function (t) {
				var td = new doh.Deferred();


				var object = {
					random: true
				};
				storage.add(object).then(td.getTestCallback(function () {
					t.t(!!object.id);
				}));

				return td;
			}
		}
	]);
});