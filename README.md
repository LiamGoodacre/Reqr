# Reqr

Tiny configurable library for requiring collections of files.


## Reqr.dir(path, config)

`require`s a collection of files in a directory.

Returns a tree object: each leaf is a loaded file, each node is a directory.


### The defaults

The following is an example with the default configuration.

```js
Reqr.dir('.', {
  recur: false,
  filter: /\.js$/,
  alias: Reqr.replace(/\.js$/, ''),
  aliasDir: function (a) { return a; },
  cull: true,
  lazy: false,
  transform: function (a) { return a; },
  choose: function (a, b) { return a; }
})
```


### Config

#### recur

Whether or not to traverse down all directories found.

```js
{ "type": "Boolean"
, "default": false }
```

#### filter

When filter is a function it is called with the filenames found. If it returns truthy, then the file is accepted into the result. When filter is a regular expression, the file is accepted if the filename matches the filter pattern. Otherwise, files are always accepted.

```js
{ "type": "(String -> Boolean) | RegExp | *"
, "default": /\.js$/ }
```

#### alias

Transform file names.

```js
{ "type": "String -> String"
, "default": Reqr.replace(/\.js$/, '') }
```

#### aliasDir

Transform the names of directories.

```js
{ "type": "String -> String"
, "default": function (a) { return a; } }
```

#### cull

Ignore empty directories.

```js
{ "type": "Boolean"
, "default": true }
```

#### lazy

When true, the files will not be loaded until they are first accessed.

```js
{ "type": "Boolean"
, "default": false }
```

#### transform

Defines a transformation to be applied to every loaded file.

```js
{ "type": "* -> *"
, "default": function (a) { return a; } }
```

#### choose

Defines the mechanism by which we should choose which file to include if
there is an alias conflict.  A `Modlet` is an object with a file `path` and
the loaded `module`: `{ path: String, module: * }`.

```js
{ "type": "(Modlet, Modlet) -> Modlet"
, "default": function (a, b) { return a; } }
```



## Reqr.scan(path, config)


Scan for a collection of files in a directory - .

Returns a tree object: each leaf is a file path, each node is a directory.


### The defaults

The following is an example with the default configuration.

```js
Reqr.scan('.', {
  recur: false,
  filter: /\.js$/,
  alias: Reqr.replace(/\.js$/, ''),
  aliasDir: function (a) { return a; },
  cull: true
})
```


### Config

#### recur

Whether or not to traverse down all directories found.

```js
{ "type": "Boolean"
, "default": false }
```

#### filter

When filter is a function it is called with the filenames found. If it returns truthy, then the file is accepted into the result. When filter is a regular expression, the file is accepted if the filename matches the filter pattern. Otherwise, files are always accepted.

```js
{ "type": "(String -> Boolean) | RegExp | *"
, "default": /\.js$/ }
```

#### alias

Transform file names.

```js
{ "type": "String -> String"
, "default": Reqr.replace(/\.js$/, '') }
```

#### aliasDir

Transform the names of directories.

```js
{ "type": "String -> String"
, "default": function (a) { return a; } }
```

#### cull

Ignore empty directories.

```js
{ "type": "Boolean"
, "default": true }
```



## Reqr.load(tree, config)

`require`s a collection of files in a tree.

Given a tree of filenames, returns a new tree object in which each leaf is
the corresponding filename `require`d, and each node is a directory.


### The defaults

The following is an example with the default configuration.

```js
Reqr.load(tree, {
  lazy: false,
  transform: function (a) { return a; },
  choose: function (a, b) { return a; }
})
```


### Config

#### lazy

When true, the files will not be loaded until they are first accessed.

```js
{ "type": "Boolean"
, "default": false }
```

#### transform

Defines a transformation to be applied to every loaded file.

```js
{ "type": "* -> *"
, "default": function (a) { return a; } }
```

#### choose

Defines the mechanism by which we should choose which file to include if
there is an alias conflict.  A `Modlet` is an object with a file `path` and
the loaded `module`: `{ path: String, module: * }`.

```js
{ "type": "(Modlet, Modlet) -> Modlet"
, "default": function (a, b) { return a; } }
```



## Reqr.force(tree)

Given a tree of lazily required files, force load all the files.


### The defaults

The following is an example with the default configuration.

```js
Reqr.force(tree, {
  recur: true
})
```


### Config

#### recur

Whether or not to traverse the whole tree. When false, only loads the top-level.

```js
{ "type": "Boolean"
, "default": false }
```



## Reqr.replace(pattern, replacement)(string)

Util function for `string.replace(pattern, replacement)`.

