---
---

Every once in a while, I find the need to use regular expressions in Python
programs. Most of the time, my needs are simple, such as: check if a string
contains a word, where the word may have first letter capitalized.

## Looking for a pattern at beginning of a string

In Python, regular expression functionality is provided by `re` module. And the most
basic function to perform regular expression matching is the `match()` function.

`match()` accepts two arguments (and an optional third argument which we will not
discuss in this post). The first argument is the pattern we are looking for and
the second argument is the string we want to search in.

`match()` looks for the pattern at the beginning of the string.

## Using in a conditional

```
import re

if re.match("[lL]orem", "Lorem ipsum dolor sit amet."):
    print("matched")
else:
    print("not matched")
```

The above conditional works because:
- `match()` returns `None` if there is no match
- returns a `match` object if there is a match
- presense of an object (the `match` object) makes the return value have truthy value of `True`
- since `None` is equivalent to boolean value `False`, we can use `re.match()` directly in a conditional as shown above.

## Using Search

While `match()` may satisfy many search requirements, it has one obvious
limitation - `match()` looks for pattern only at the beginning of the string.
The `re` module provides the function `search()` which overcomes this limitation.
Function `search()` looks for the pattern anywhere in the string.

As we did with match() above, we can use `search()` in a simple conditional, as follows:
```
if re.search("[dD]olor", "Lorem ipsum dolor sit amet."):
    print("match found")
else:
    print("match not found")
```

Here, we are looking for the pattern that occurs anywhere in the string, not just at
the beginning. If the pattern is present, the `if` condition will evaluate to `True`.
If there is no match then `search()` returns `None` which evaluates to truthy
value of `False`.


## Basic string match without using regular expressions

While this post is about using regular expressions, simple searches can be done
using string operations:

<ins>in operator</ins>
```
if "dolor" in "Lorem ipsum dolor sit amet.":
    print("match found")
```

<ins>string.lower()</ins>
```
if "dolor" in "Lorem ipsum DOLOR sit amet.".lower():
    print("match found")
```

<ins>comparison operators</ins>
- "==" and "!==" operators can be used to compare equivalence of two strings.

## Conclusion

In this post, I wanted to write about basic usage of regular expressions within
python programs. Python's `re` module provides a lot more functionality than
described here.
