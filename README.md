debug.js
===

&copy; [James Padolsey](http://james.padolsey.com)

*debug.js* is an in-browser JavaScript error-reporter.

 * Runs your JavaScript through JSLint and shows any emerging errors.
 * Runs your JavaScript through the browser and provides feedback on runtime errors.
 
*debug.js* is not really a debugger but of great aid in the debugging process. It's not meant as a replacement for current debugging tools (such as Firebug) but more as another tool you can use to ensure that your JavaScript is "up to the mark".

**Note: This is still in development; bugs expected!**

Usage:
---

Download debug.js and include it in your document, right at
the bottom:

    <script src="debug.js"></script>

If no errors (syntax or runtime) exist then you won't see anything. If errors do exist then an overlay should appear which details the errors encountered.

Example:
---

    <html>
        <head>
            <title>DEBUG DEMO</title>
        </head>
        <body>
            
            <!--JSLint Example-->
            <script>
                var regex = /ProblemWithThisRegex[123-]/
            </script>
            
            <!--RuntimeError Example-->
            <script>
                var something = nonExistingObject.property;
            </script>
            
            <script src="debug.js"></script>
            
        </body>
    </html>

**Output produced from the above source**:

![debug.js preview](http://img44.imageshack.us/img44/1272/debug.png)