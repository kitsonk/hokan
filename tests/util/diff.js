define([
	'doh/main',
	'../../util/diff'
], function (doh, diff) {
	doh.register('tests.util.diff', [{
		name: 'primitives',
		runTest: function (t) {
			var d = diff(undefined, null);
			t.is(d.type, 'add');
			t.is(d.value, null);
			d = diff(undefined, undefined);
			t.is(d, undefined);
			d = diff('test', 'test');
			t.is(d, undefined);
			d = diff(0, 0);
			t.is(d, undefined);
			d = diff(1, 1);
			t.is(d, undefined);
			d = diff(true, true);
			t.is(d, undefined);
			d = diff(false, false);
			t.is(d, undefined);
			d = diff('1', 1);
			t.is(d.type, 'change');
			t.is(d.value, 1);
			d = diff(null, false);
			t.is(d.type, 'change');
			t.is(d.value, false);
		}
	}, {
		name: 'objects with primitives',
		runTest: function (t) {
			var d = diff({foo: 'bar'}, {foo: 'bar'});
			t.is(d, undefined);
			var a = { foo: 'bar' };
			var b = { foo: 'bar' };
			d = diff(a, b);
			t.is(d, undefined);
			b.foo = 1;
			d = diff(a, b);
			t.is(d.foo.type, 'change');
			t.is(d.foo.value, 1);
			b.bar = 'qat';
			a.foo = 1;
			d = diff(a, b);
			t.is(d.bar.type, 'add');
			t.is(d.bar.value, 'qat');
			t.is(d.foo, undefined);
			a.baz = 9;
			a.bar = 'qat';
			d = diff(a, b);
			t.is(d.baz.type, 'delete');
			t.is(d.baz.value, undefined);
			t.is(d.foo, undefined);
			t.is(d.bar, undefined);
		}
	}, {
		name: 'objects with non-primitives',
		runTest: function (t) {
			var foo = { bar: 9 };
			var a = {
				foo: foo,
				bar: {
					baz: 'qat'
				}
			};
			var b = {
				foo: foo,
				bar: {
					baz: 'qat'
				}
			};
			var d = diff(a, b);
			t.is(d, undefined);
			b.bar.qat = 0;
			d = diff(a, b);
			t.is(d.bar.type, 'change');
			t.is(d.bar.value.qat.type, 'add');
			t.is(d.bar.value.qat.value, 0);
			a.bar.qat = 0;
			a.foo.bar = 5;
			d = diff(a, b);
			t.is(d, undefined);
			a.qat = foo;
			d = diff(a, b);
			t.is(typeof d.qat, 'object');
			t.is(d.qat.type, 'delete');
			b.qat = foo;
			b.baz = { bar: 'foo' };
			d = diff(a, b);
			t.is(typeof d.baz, 'object');
			t.is(d.baz.type, 'add');
			t.is(d.baz.value.bar, 'foo');
			a.baz = { bar: 'foo' };
			d = diff(a, b);
			t.is(d, undefined);
		}
	}, {
		name: 'arrays with primitives',
		runTest: function (t) {
			var d = diff([1, 2, 3], [1, 2, 3]);
			t.is(d, undefined);
			d = diff([1, 2, 3], [3, 2, 1]);
			t.is(d, undefined);
			d = diff([1, 2], [1, 2, 3]);
			t.t(d instanceof Array);
			t.is(d.length, 1);
			t.is(d[0].type, 'add');
			t.t(d[0].value instanceof Array);
			t.t(d[0].value.length, 1);
			t.t(d[0].value[0], 3);
			d = diff([1, 2, 3], [2, 1]);
			t.is(d.length, 1);
			t.is(d[0].type, 'delete');
			t.is(d[0].value.length, 1);
			t.is(d[0].value[0], 3);
			d = diff([1, 2, 3], [4, 2, 1]);
			t.is(d.length, 2);
			t.is(d[0].type, 'delete');
			t.is(d[0].value.length, 1);
			t.is(d[0].value[0], 3);
			t.is(d[1].type, 'add');
			t.is(d[1].value.length, 1);
			t.is(d[1].value[0], 4);
		}
	}, {
		name: 'arrays with non-primitives',
		runTest: function (t) {
			var foo = { bar: 9 };
			var a = [ foo, { qat: 'baz' } ];
			var b = [ foo, { qat: 'baz' } ];
			var d = diff(a, b);
			t.is(d, undefined);
			a.push({ bar: 4 });
			d = diff(a, b);
			t.t(d instanceof Array);
			t.is(d.length, 3);
			t.is(d[0], undefined);
			t.is(d[1], undefined);
			t.is(d[2].type, 'delete');
			b.push({ bar: 4 });
			d = diff(a, b);
			t.is(d, undefined);
			b[0].bar = 1;
			d = diff(a, b);
			t.is(d, undefined);
			b[1].qat = 9;
			d = diff(a, b);
			t.is(d.length, 2);
			t.is(d[0], undefined);
			t.is(d[1].type, 'change');
			t.is(typeof d[1].value.qat, 'object');
			t.is(d[1].value.qat.type, 'change');
			t.is(d[1].value.qat.value, 9);
			a[1].qat = 9;
			a.push([1, 2, 3]);
			b.push([1, 2]);
			d = diff(a, b);
			t.is(d.length, 4);
			t.is(d[0], undefined);
			t.is(d[1], undefined);
			t.is(d[2], undefined);
			t.is(d[3].type, 'change');
			t.t(d[3].value instanceof Array);
			t.is(d[3].value.length, 1);
			t.is(d[3].value[0].type, 'delete');
			t.t(d[3].value[0].value instanceof Array);
			t.is(d[3].value[0].value.length, 1);
			t.is(d[3].value[0].value[0], 3);
		}
	}]);
});