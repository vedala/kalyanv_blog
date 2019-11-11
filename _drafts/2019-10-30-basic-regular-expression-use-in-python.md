---
---
## Motivation

Once in a while, I find the need to use regular expressions in Python
programs. The regular expressions are usually just one step above what
I might get by using plain string search.

Most of the time, my needs are simple, such as: check if a word exists in another string, ignoring case


## Using in a Conditional

```
if re.match("[aA]bcd", "abcdefgh"):
    print("matched")
else:
    print("not matched")
```

- re.match(), return `None` if there is no match.
- returns a `match object` if there is a match
- Since match objects always have a boolean value of true. And since, `None` is equivalent to boolean value false, we can use `re.match()` directly in a conditional as shown above.
- reference: https://docs.python.org/3/library/re.html#match-objects
- Since match object is a class instance, the class definition guarantees that a True is always returned (in the above link). Also see following links:
    - Truth value testing: https://docs.python.org/3/library/stdtypes.html#truth-value-testing
    - https://stackoverflow.com/a/10243323/3137099

## Search and Replace
