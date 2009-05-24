debug.js
===

&copy; [James Padolsey](http://james.padolsey.com)

*debug.js* is an in-browser JavaScript error-reporter.

It uses [JSLINT](http://jslint.com) (By Crockford) to report runtime errors and relies on native browser error handling for "runtime" errors. These "runtime" errors are shown in a similar fashion to the validation errors (JSLINT).

The targetted JavaScript code will only be allowed to run once JSLINT has been passed; once this happens the "runtime" errors (if any) will be displayed.

---

Usage:
---

Download debug.js and include it in your document, right at
the bottom:

    <script src="debug.js"></script>

Using it requires you to change the type of target SCRIPT
elements.

Note: *debug.js* will not work with externally hosted JavaScript files (hosted on a separate domain)

###Exmaple (code within &lt;script/&gt;)

    <script type="text/javascript:debug(name)">
    // ... your script
    <script>

###Exmaple (&lt;script/&gt; with SRC attribute)
    
    <script src="myfile.js" type="text/javascript:debug(name)">
    </script>
    
Simply add ":debug(name)" to the end of your TYPE attributes; the "name" should be descriptive, e.g.

    <script type=":debug(mainExec)">
    // .. mainExec function here...
    </script>

Notice that ":debug()" can be used as a type on its own; you don't have to prefix it with "text/javascript".
    
*debug.js* does not rely on or make use of browser plugins such as firebug.

*debug.js* is mostly intended for debugging outside of capable error-reporting browsers. IE development, for example, will massively benefit from debeg.js

