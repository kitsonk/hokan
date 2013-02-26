define([
	'dojo/has'
], function (has) {
	has.add('storage-session', window.sessionStorage);
	has.add('storage-local', window.localStorage);
	has.add('storage-idb', window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
});