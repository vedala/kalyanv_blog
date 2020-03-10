---
---

Once in a while, I find the need to use regular expressions in Python
programs. Most of the time, my needs are simple, such as:
- check if a string contains a word, where the word may have first letter capitalized
- check if a string contains a valid opening HTML tag (e.g. <div name="someDiv">)

## Using in a Conditional

In Python, regular expression functionality is provided by `re` module. And the most
basic function to perform regular expression matching is the `match()` function.

`match()` accepts two arguments (and an optional third argument which we will not
discuss in this post). The first argument is the *pattern* we are search for and
the second argument is the *string* we want to search in.

```
import re

if re.match("[aA]bcd", "abcdefgh"):
    print("matched")
else:
    print("not matched")
```

- re.match(), returns `None` if there is no match.
- returns a `match object` if there is a match
- Since match objects always have a boolean value of true. And since, `None` is equivalent to boolean value false, we can use `re.match()` directly in a conditional as shown above.
- reference: https://docs.python.org/3/library/re.html#match-objects
- Since match object is a class instance, the class definition guarantees that a True is always returned (in the above link). Also see following links:
    - Truth value testing: https://docs.python.org/3/library/stdtypes.html#truth-value-testing
    - https://stackoverflow.com/a/10243323/3137099

## Search

- match anywhere in string
- match multiple

We can still use in simple conditional, as follows:
```
if re.search("foo", "this string has foo bar baz"):
    print("match found")
else:
    print("match not found")

## Basic string match without using regular expressions
- `in` operator
- `lower`
- `==` and `!=`

## Additional considerations
- Compile
- raw strings and escaping
In this post, I wanted to write about the simple regular expression usage
described above.
<Describe compile and its benefits but do not include any code>
The sequence

```
prog = re.compile(pattern)
result = prog.match(string)
```
is equivalent to
```
result = re.match(pattern, string)
```

## References
- stack overflow discussion
- truthy value
- regular expression blog
