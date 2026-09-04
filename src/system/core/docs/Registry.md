The Registry
============

The registry utilizes absolute paths, since working directories for a registry
are not necessary. This document is merely a brief overview of the inner
workings.

1.	Keys
	----
	**Overview**  
	Keys are containers of values or other keys.
	Usually, a key is denoted by a path with a trailing slash.

2.	Values
	------
	**Overview**  
	Values are containers of data, such as a number, string, array or somthing
	else entirely. A trailing slash cannot be used for a value path.

Example valid paths:

```
System/Provisioning
/System/Provisioning
```

These paths are only valid if the objects they point to are keys:

-	`System/Items/`
-	`/System/Items/`

A trailing slash denotes a key. The registry will assume a path with a
trailing slash is a key. If its assumption is incorrect, it will throw an
error.