var profile = (function () {
	var testResourceRe = /^hokan\/tests\//,

		copyOnly = function (filename, mid) {
			var list = {
				'hokan/package': 1,
				'hokan/package.json': 1,
				'hokan/tests': 1,
				'hokan/test': 1
			};
			return (mid in list) ||
				(/^hokan\/resources\//.test(mid) && !/\.css$/.test(filename)) ||
				/(png|jpg|jpeg|gif|tiff)$/.test(filename);
		};

	return {
		resourceTags: {
			test: function (filename, mid) {
				return testResourceRe.test(mid);
			},

			copyOnly: function (filename, mid) {
				return copyOnly(filename, mid);
			},

			amd: function (filename, mid) {
				return !testResourceRe.test(mid) && !copyOnly(filename, mid) && /\.js$/.test(filename);
			}
		}
	};
})();