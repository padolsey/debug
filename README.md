debug.js
===

debug.js is an in-browser JavaScript error-reporter.

It uses [This link](http://jslint.com) (By Crockford) to report runtime errors
and relies on native browser error handling for runtime
errors.

--

Usage:
---

Download debug.js and include it in your document, right at
the bottom:

    <script src="debug.js"></script>

Using it requires you to change the type of target SCRIPT
elements.

Note: THIS DOES NOT WORK WITH EXTERNALLY HOSTED JS FILES

E.g.

    <script type="text/javascript:debug(name)">
    // ... your script
    <script>
    
    <script src="myfile.js" type="text/javascript:debug(name)">
    </script>
    
Simply add ":debug(name)" to the end of your TYPE attributes;
the name should be descriptive, e.g.

    <script type=":debug(mainExec)">
    // .. mainExec function here...
    </script>
    
debug.js does not rely on or make use of browser plugins
such as firebug.

debug.js is mostly intended for debugging outside of capable
error-reporting browsers. IE development, for example, will
massively benefit from debeg.js

