define([
	'doh/main',
	'../LocalStorage'
], function (doh, LocalStorage) {
	var storage = new LocalStorage({
		name: 'storage'
	});

	doh.register('tests.LocalStorage', [
		{
			name: 'setup',
			runTest: function (t) {
				storage.clear();
				storage.put({id: 1, name: 'one', prime: false, mappedTo: 'E'});
				storage.put({id: 2, name: 'two', even: true, prime: true, mappedTo: 'D'});
				storage.put({id: 3, name: 'three', prime: true, mappedTo: 'C'});
				storage.put({id: 4, name: 'four', even: true, prime: false, mappedTo: null});
				storage.put({id: 5, name: 'five', prime: true, mappedTo: 'A'});
				t.is(typeof storage.index, 'object');
			}
		}, {
			name: 'get',
			runTest: function (t) {
				t.is(storage.get(1).name, 'one');
				t.is(storage.get(4).name, 'four');
				t.t(storage.get(5).prime);
			}
		}, {
			name: 'query',
			runTest: function (t) {
				t.is(storage.query({ prime: true }).length, 3);
				t.is(storage.query({ even: true })[1].name, 'four');
			}
		}, {
			name: 'query with string',
			runTest: function (t) {
				t.is(storage.query({ name: 'two' }).length, 1);
				t.is(storage.query({ name: 'two' })[0].name, 'two');
			}
		}, {
			name: 'query with RegExp',
			runTest: function (t) {
				t.is(storage.query({ name: /^t/ }).length, 2);
				t.is(storage.query({ name: /^t/ })[1].name, 'three');
				t.is(storage.query({ name: /^o/ }).length, 1);
				t.is(storage.query({ name: /o/ }).length, 3);
			}
		}, {
			name: 'query with test function',
			runTest: function (t) {
				t.is(storage.query({ id: { test: function (id) { return id < 4; } } }).length, 3);
				t.is(storage.query({ even: { test: function (even, object) { return even && object.id > 2; } } }).length, 1);
			}
		}, {
			name: 'query with sort',
			runTest: function (t) {
				t.is(storage.query({ prime: true }, { sort: [ { attribute: 'name' } ] }).length, 3);
				t.is(storage.query({ even: true }, { sort: [ { attribute: 'name' } ] })[1].name, 'two');
				t.is(storage.query({ even: true }, { sort: function (a, b) {
					return a.name < b.name ? -1 : 1;
				}})[1].name, 'two');
				t.is(storage.query(null, { sort: [{ attribute: 'mappedTo' } ] })[4].name, 'four');
			}
		}, {
			name: 'query with paging',
			runTest: function (t) {
				t.is(storage.query({ prime: true }, { start: 1, count: 1 }).length, 1);
				t.is(storage.query({ even: true }, { start: 1, count: 1 })[0].name, 'four');
			}
		}, {
			name: 'put update',
			runTest: function (t) {
				var four = storage.get(4);
				four.square = true;
				storage.put(four);
				four = storage.get(4);
				t.t(four.square);
			}
		}, {
			name: 'put new',
			runTest: function (t) {
				storage.put({
					id: 6,
					perfect: true
				});
				t.t(storage.get(6).perfect);
			}
		}, {
			name: 'add duplicate',
			runTest: function (t) {
				var threw;
				try {
					storage.add({
						id: 6,
						perfect: true
					});
				}
				catch (e) {
					threw = true;
				}
				t.t(threw);
			}
		}, {
			name: 'add new',
			runTest: function (t) {
				storage.add({
					id: 7,
					prime: true
				});
				t.t(storage.get(7).prime);
			}
		}, {
			name: 'remove',
			runTest: function (t) {
				t.t(storage.remove(7));
				t.is(storage.get(7), undefined);
			}
		}, {
			name: 'remove missing',
			runTest: function (t) {
				t.f(storage.remove(77));
				// make sure nothing changed
				t.is(storage.get(1).id, 1);
				t.is(storage.query().length, 6);
			}
		}, {
			name: 'query after changes',
			runTest: function (t) {
				t.is(storage.query({ prime: true }).length, 3);
				t.is(storage.query({ perfect: true }).length, 1);
			}
		}, {
			name: 'test IFR style data',
			runTest: function (t) {
				var anotherStore = new LocalStorage({
					name: 'anotherStore',
					data: {
						items: [
							{ name: 'one', prime: false },
							{ name: 'two', even: true, prime: true },
							{ name: 'three', prime: true }
						],
						identifier: 'name'
					}
				});
				t.is(anotherStore.get('one').name, 'one');
				t.is(anotherStore.query({ name: 'one' })[0].name, 'one');
			}
		}, {
			name: 'add new ID assignment',
			runTest: function (t) {
				var object = {
					random: true
				};
				storage.add(object);
				t.t(!!object.id);
			}
		}
	]);
});