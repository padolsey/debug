debug.js
===

&copy; [James Padolsey](http://james.padolsey.com)

*debug.js* is an in-browser JavaScript error-reporter.

 * Runs your JavaScript through [JSLint](http://jslint.com] and shows any emerging errors.
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

![debug.js preview](http://img20.imageshack.us/img20/9337/debugz.png)

Tips:
---

To skip a SCRIPT, simple preceed it with a comment containing just the word "skip":

    <!--skip-->
    <script>...</script>
    
To only skip the JSLint portion of the test preceed your SCRIPT with the following comment:

    <!--skiplint-->
    <script>...</script>
    
To give your SCRIPTS IDs, preceed them with comments like these: (note, don't use "skip" or "skiplint" as IDs!)

    <!--foo bar-->
    <script>...</script>
    
    <!--wowza-->
    <script>...</script>
    
(A script's ID appears alongside its report - an especially useful feature if you have many...)
    
*debug.js* works with externally hosted JavaScript files too. The only type of file it cannot reach is one stored locally on a seperate domain to the document. For example: the documents URL is *http://127.0.0.1/something.html* and the script is located at *http://localhost/script.js* - *debug.js* won't be able to reach this...