# hokan/LocalStorage

**LocalStorage** is a module that provides a Dojo Store API interface to DOM Storage's localStorage.

Careful consideration should be given when using this module.  There are several performance considerations when
storing large amounts of data, or heavy read write functions.  Generally speaking it should only be used when there is
not other supported functionality on the browser (like IndexedDB).

In particular, localStorage stores all data in strings.  This requires the LocalStorage to convert the objects into
strings using the JSON capabilities of the user agent (or the JSON capabilities of Dojo if not available natively).
In addition, localStorage does not support querying, which requires all data to be retrieved and then filtered.  In
many cases it maybe more efficient to store the data once per session as a single JSON string and feed it into a
``dojo/store/Memory``.

## Usage

Usage is similar to other Dojo Store API stores:

```js
require(['hokan/LocalStorage'], function (LocalStorage) {
	// Create a store, preferably with a name
	var store = new LocalStorage({
		name: 'store'
	});

	// Stores an object
	store.put({
		id: 1,
		foo: 'bar'
	});

	// Outputs the object
	console.log(store.get(1));
});
```

## name

The `name` of the `LocalStorage` is used to "namespace" the localStorage data.  This means that you could have the
same IDs across multiple instance of LocalStore, if you give each instance a unique name.  `LocalStorage` defaults to
the name of `default` if none is provided.

## idProperty

``idProperty`` provides the ID property of each object which identifies the object uniquely.  This defaults to ``id``.

## queryEngine

The engine the performs the query on the objects contained in the store.  This defaults to
``dojo/store/util/SimpleQueryEngine``.

## get(id)

Return an object identified by ``id``.

## getIdentity(object)

Return the identifier of the object.

## put(object, directives)

Stores an object.  If ``directives.overwrite`` is ``false`` then it will throw an error if there is already an object
stored with that id.

## add(object, directives)

Stores an object, but ensures that if an object is already stored with the supplied object's ID, it is not overwritten.

## remove(id)

Remove an object from the store based on the supplied ID.

## query(query, options)

Perform a query on the store, returning a ``dojo/store/util/QueryResults`` result object of the objects that match
the query.

## setIndex()

## clear()

Used to clear the store of all records.  This is similiar to ``window.localStorage.clear()`` expect that it will only
remove the objects associated with the ``name`` of the ``LocalStorage``.
