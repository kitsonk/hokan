# hokan

**hokan** is a package of AMD modules that provide tools to work with persistent local storage.  In particular it
provides a [Dojo Store API][store-api] interface to persistent local storage.

## Requirements

The modules provided here should work with [Dojo Core][core] 1.7 or later.

## License

This code is licensed under the ["New" BSD License](LICENSE).

## Installation

**hokan** can be installed via [cpm][cpm], [volo][volo] or [npm][npm], or simply [downloaded][download].

Via cpm:

```bash
$ cpm install hokan
```

Via volo:

```bash
$ volo add kitsonk/hokan
```

Via npm:

```bash
$ npm install hokan
```

## Modules

Please refer to the documentation for each of the modules for specifics of their usage:

* [LocalStorage](docs/LocalStorage.md) - An Dojo Store API interface to DOM Storage's localStorage
* [util](docs/util.md) - Utility functions for *hokan*

## Testing

Unit tests require the [D.O.H.][doh] installed and are located in the `tests` path.

[core]: http://dojotoolkit.org/reference-guide/dojo/
[store-api]: http://dojotoolkit.org/reference-guide/dojo/store.html
[cpm]: https://github.org/kriszyp/cpm
[volo]: http://volojs.org/
[npm]: http://npmjs.org/
[doh]: http://dojotoolkit.org/reference-guide/1.8/util/doh.html
