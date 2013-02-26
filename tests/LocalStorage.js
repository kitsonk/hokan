define([
	'doh/main',
	'../LocalStorage'
], function (doh, LocalStorage) {
	var storage = new LocalStorage();

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
		}
	]);
});