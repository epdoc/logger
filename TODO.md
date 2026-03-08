# TODO

We are in the middle of an effort to hopefully simplify some of the logic in packages/logger. 
There is a new packages/msgbuilder/AI.md that helps you understand this module.
packages/loglevels has a library-metadata.json file and the code base is small.

## Finish migrating code to use loglevel `Spec` object instead of severity or name

Previously we were using either the log level name or severity and having to ask packages/loglevel to 