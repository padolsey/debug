/*
 
    DEBUG.js
    (c) James Padolsey
    http://james.padolsey.com
    
    DEBUG.js is an in-browser JavaScript error-reporter
    Read README.txt for instructions
    
    v 0.2
    
    Contributors {
        David Walker
    }
 
*/

(function(){
    
    var strictCommenting = true;
    
    var util = {
        forEach: function(arr, fn) {
            for (var i = 0, l = arr.length; i < l; i+=1) {
                fn( arr[i], i, arr );
            }
        },
        el: function(type, styles) {
            /* Create new element */
            var el = document.createElement(type), attr;
            for (var prop in styles) {
                el.style[prop] = styles[prop];
            }
            return el;
        },
        prevComment: function(node){
            var comment;
            while ( (node = node.previousSibling) ) {
                if (node.nodeType === 1 || (node.nodeType === 3 && /[^\s\n\r]/.test(node.data))) {
                    break;
                }
                if (node.nodeType === 8) {
                    comment = node;
                }
            }
            return comment;
        },
        getID: function(script) {
            var prev = util.prevComment(script);
            return script.id || (prev && !/^skip(\s?(js)?lint)?$/.test(prev.data) && prev.data) || 'NULL';
        },
        isSkippable: function(script) {
            var prev = util.prevComment(script), i, l;
            if (window.DEBUG_SKIP) {
                if (DEBUG_SKIP.indexOf) { return DEBUG_SKIP.indexOf(script) > -1; }
                for (i = 0, l = DEBUG_SKIP.length; i < l; i++) {
                    if ( DEBUG_SKIP[i] === script ) {
                        return true;
                    }
                }
            }
            return prev && prev.data && /^skip$/i.test(prev.data);
        },
        canRunJSLINT: function(script) {
            var prev = util.prevComment(script), i, l;
            if (window.DEBUG_SKIP_LINT) {
                if (DEBUG_SKIP_LINT.indexOf) { return DEBUG_SKIP_LINT.indexOf(script) > -1; }
                for (i = 0, l = DEBUG_SKIP_LINT.length; i < l; i++) {
                    if ( DEBUG_SKIP[i] === script ) {
                        return true;
                    }
                }
            }
            return !(prev && prev.data && /^skip\s?(js)?lint$/i.test(prev.data));
        },
        txt: function(t) {
            return document.createTextNode(t);
        },
        retab: function(str, leading) {
            var leadingSpaces = leading || (str.match(/^\s\s*/)||[''])[0].length,
                splitStr = str.split(/\r\n|\n/);
            if (leadingSpaces > 0) {
                for (var i = 0, l = splitStr.length; i < l; i++) {
                    splitStr[i] = splitStr[i].replace(RegExp('^\\s{1,' + leadingSpaces + '}(?![\'"\/])'), '');
                }
                str = splitStr.join('\n');
            }
            return {str:str,leading:leadingSpaces};
        },
        findMarkers: function(msg, evidence){
            var poss = [
                /(?:undefined|can't find) variable: (.+?)\s/i,
                /^(?:'|")?(.+?)(?:'|")? is (un|not )(defined|a function)/i,
                /(?:'|")?(.+?)(?:'|")? is null or not an object/i,
                /cannot (?:set|read) property (?:'|")?(.+?)(?:'|")? of/i,
                /reference to undefined property (?:'|")?(.+?)(?:'|")?$/i,
                /has no method (?:'|")?(.+?)(?:'|")?$/i,
                /and instead saw (?!an )(?:'|")?([^"']{2,})(?:'|")?(\.|\s|$)/i
            ];
            evidence = evidence && evidence.replace(/(["'\/])(\\\1|.)+\1/g, function($0){
                return Array($0.length + 1).join('?');
            });
            for (var i = 0, l = poss.length; i < l; i++) {
                if (poss[i].test(msg)) {
                    
                    var match = msg.match(poss[i])[1],
                        matchEnd = '(?!\\s*?[:' + (i>2?'':'=') + ']|\\w)';
                        
                    return [evidence.search( RegExp('[^\\w]' + util.cleanForRegex(match).replace(/["']/g,'["\']') + matchEnd) ) + 1, match.length];
                }
            }
            return null;
        },
        escape: function(str) {
            return str.replace(/&/g, '&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        },
        cleanForRegex: function(str) {
            return str.replace(/([\$\(\)\[\]\{\}\^])/g,'\\$1');
        },
        getJSONP: function(url, fn){
            /* 909999 */
            var uid = 'json' + (+new Date()),
                script = util.el('script');
                
            url += '&callback=' + uid;
            
            script.src = url;
            
            window[uid] = function(data) {
                script.parentNode.removeChild(script);
                if(fn) { fn(data); }
            };
            
            document.body.appendChild(script);
            
        }
    };
    
    var debugSrc = (function(){
        /* Get file SRC (this file, debug.js) */
        var s = document.getElementsByTagName('script');
        return s[s.length-1].src;
    })();
    
    var extSources = (function(){
        
        var scripts = document.getElementsByTagName('script'),
            external = [],
            sources = [];
            
        util.forEach(scripts, function(script){
            if ( /^https?:\/\/(?!localhost|127\.0\.0\.1)/.test(script.src) && !util.isSkippable(script) ) {
                external.push( script );
                sources.push( "null;" );
            }
        });
        
        util.forEach( external, function(script, i) {
            util.getJSONP('http://qd9.co.uk/service/proxy-jsonp/?url=' + encodeURIComponent(script.src), function(data){
                sources[i] = data.source;
                if (external.length-1 === i) {
                    extSources.complete = true;
                }
            });
        });
        
        return {
            complete: !external.length,
            get: function(script) {
                for (var i = 0, l = external.length; i < l; i+=1) {
                    if (external[i] === script) {
                        return sources[i];
                    }
                }
                return false;
            }
        };
    })();
    
    /* Load JSLINT, don't start until we've got it! */
    var jsLintWaiter = setInterval(function(){
        if (window.JSLINT && extSources.complete) {
            clearInterval(jsLintWaiter);
            init();
        }
    }, 100);
    
    if (!window.JSLINT) {
        var lint = document.createElement('script'),
            lintSrc = 'http://www.jslint.com/fulljslint.js';
        lint.src = lintSrc;
        document.body.appendChild(lint);
    }
    
    /* Overlaying document; where the errors are displayed. */
    var modal = (function(){
        /* Modal interface. */
        var D = document,
            style = function(el, s) {
                for (var p in s) {
                    el.style[p] = s[p];
                }
                return el;
            },
            overlay = style(document.createElement('div'), {
                height: '100%',
                width: '100%',
                position: 'absolute',
                top: 0,
                left: 0,
                zIndex: 999,
                background: '#DDD',
                color: '#222',
                overflow: 'auto',
                display: 'none'
            }),
            list = style(document.createElement('ol'), {
                padding: '20px',
                listStyle: 'none',
                margin: 0
            }),
            mainHeading = style(document.createElement('h1'), {
                padding: '20px 0 0 ',
                textAlign: 'center',
                margin: 0,
                fontFamily: '"Consolas","Lucida Console",Courier,mono',
                fontSize: '20px',
                fontStyle: 'normal',
                backgroundColor: 'transparent',
                color: 'black'
            }),
            nextGroup = list;
              
        mainHeading.innerHTML = 'PLEASE WAIT...';
        overlay.appendChild(mainHeading);
        
        var run = false;
        return {
            remove: function() {
                overlay.parentNode.removeChild(overlay);
            },
            add : function(text, error) {
                /* Only inject the "modal" if this function is called: (for the 1st time): */
                if (!run) {
                    document.documentElement.style.height = document.body.style.height =
                    document.documentElement.style.width = document.body.style.width = '100%';
                    document.documentElement.style.overflow = document.body.style.overflow = 'hidden';
                    overlay.style.display = 'block';
                    overlay.appendChild(list);
                    document.body.appendChild(overlay);
                    run = true;
                }
                if (!text) { return {heading:mainHeading}; }
                var li = style(document.createElement('li'), {
                    padding: '4px 0 10px 0',
                    fontWeight: '700',
                    fontFamily: '"Consolas","Lucida Console",Courier,mono',
                    fontSize: '15px'
                });
                if(error && error.evidence) {
                    
                    var pre = style(document.createElement('pre'), {
                        padding: '10px',
                        background: 'white',
                        border: '1px solid black',
                        margin: '10px 10px 10px 30px',
                        fontSize: '13px',
                        overflow: 'auto'
                    });
                    
                    var evidence = error.evidence + ' ',
                        characterStart = (isNaN(error.character) ? error.character[0] : error.character),
                        characterLen = (isNaN(error.character) ? error.character[1] : 1);
                    
                    if (characterStart === null) {
                        pre.appendChild(util.txt(util.retab(evidence).str));
                    } else {
                        var span = util.el('span', {padding:'5px',background:'pink'});
                        span.appendChild( util.txt(evidence.substring(characterStart, characterStart+characterLen)) );
                        var firstSecRetabbed = util.retab(evidence.substring(0, characterStart));
                        pre.appendChild( util.txt( firstSecRetabbed.str ) );
                        pre.appendChild( span );
                        pre.appendChild( util.txt( util.retab(evidence.substring( characterStart + characterLen ).replace(/[^\S][^\S]*$/, ''), firstSecRetabbed.leading).str ) );
                    }
                    
                    if (error.evidence.replace(/^\n/,'').split(/\r\n|\n/).length === 1) {
                        /* Replace leading spaces on single lines */
                        //pre.innerHTML = pre.innerHTML.replace(/^\s\s*|\s\s*$/, '');
                    }
                    
                    li.appendChild(pre);
                }
                li.innerHTML = text + li.innerHTML;
                nextGroup.appendChild(li);
                return true;
            },
            newGroup : function(scriptID, src) {
                nextGroup = style(document.createElement('div'), {
                    background: '#FAFFA7',
                    margin: '0 0 15px 0',
                    padding: '10px',
                    border: '1px solid red'
                });
                var heading = style(document.createElement('h3'), {
                    color: 'black',
                    padding: '5px',
                    margin: '0 0 10px 0',
                    fontSize: '15px',
                    textAlign: 'left',
                    fontFamily: '"Consolas","Lucida Console",Courier,mono',
                    borderBottom: '1px solid black'
                });
                heading.innerHTML = 'Script ID: "' + scriptID + '"';
                if (src) {
                    heading.innerHTML += ' <small>[' + src + ']</small>';
                }
                nextGroup.appendChild(heading);
                list.appendChild(nextGroup);
                return {
                    remove: function(){
                        return nextGroup.parentNode.removeChild(nextGroup);
                    }
                };
            }
        };
    })();
    
    /* Triggers modal-show PLUS gives us a ref to the heading */
    var heading = modal.add().heading;
    
    function init() {
        
        var runLint = (window.DEBUG_RUN_LINT = true),
            uid = +(new Date()),
            errorFound = false;
    
        parseScripts(/javascript$|^$/, function(src, scriptEl){
            
            var strings = [],
                sid = '_' + (+new Date()),
                lIndex = 0,
                recovered = 0,
                splitSRC,
                scriptID = util.getID(scriptEl),
                jsLintErrors = false,
                group,
                evidence, eMessage;
            
            /* Replace tabs with spaces */
            src = src.replace(/\t/g,'    ');
                
            window[uid] = function(e) {
                errorFound = true;
                heading.innerHTML = 'syntax/runtime errors in your JavaScript';
                group = group || modal.newGroup(scriptID, scriptEl.getAttribute('src'));
                if (!isNaN(e)) {
                    recovered = e;
                } else {
                    
                    evidence = splitSRC[recovered].replace(/[\n\r]\s+(?=[\n\r])/, '');
                    eMessage = e.message && e.message.replace(/[\n\r]/g, ' ');
                    
                    modal.add('ERROR (<small>SCRIPT "' +scriptID+ '", STATEMENT: ' + (recovered+1) + '</small>): ' + util.escape(e.message), {
                        /* Replace blank lines (replace(...)) */
                        evidence: evidence,
                        character: util.findMarkers(e.message, evidence)
                    });
                    
                }
                if ( lIndex !== 0 && lIndex === recovered ) {
                    /* No errors found */
                    group.remove();
                }
            };
            
            if (runLint && util.canRunJSLINT(scriptEl) ) {
                /* We tolerate unfiltered forIns because they're so popular
                   and rarely cause a problem */
                JSLINT(src, { forin: true });
                for (var error in JSLINT.errors) {
                    
                    if (!JSLINT.errors[error] || !JSLINT.errors[error].reason) {continue;}
                    
                    jsLintErrors = errorFound = true;
                    var thisError = JSLINT.errors[error],
                        marker = util.findMarkers(thisError.reason, thisError.evidence),
                        characterStart = null, characterEnd = null;
                        
                    /* JSLINT is a bit buggy here - it will miss-estimate the character position when
                       a statement ends with a String/Regex expression */
                    if ( /^missing semicolon/i.test(thisError.reason) && /['"\/]([gim]{1,3})?$/.test(thisError.evidence) ) {
                        thisError.character += (thisError.evidence.match(/\/[gim]+$/)||[''])[0].length + 2;
                    }
                    if (marker) {
                        thisError.character = marker;
                    }
                    if (thisError) {
                        group = group || modal.newGroup(scriptID, scriptEl.getAttribute('src'));
                        modal.add([
                            '<a style="color:black;" href="http://jslint.com/" target="_blank">JSLINT</a> (<small>SCRIPT "',
                            scriptID,
                            '", LINE ',
                            thisError.line + 1,
                            '</small>): ',
                            (thisError.reason)
                        ].join(''), thisError);
                    }
                }
            }
            
            /* Don't do runtime errors until script is validated. */
            if (jsLintErrors) { return ''; }
            
            /* Remove ALL comments */
            src = strictCommenting ? removeComments(src, true) : src.replace(/\/\*.+?\*\/|\/\/.+?(?=[\n\r])/g, '');
        
            /* Replace strings, Replace each end-of-line with window.uid call. */
            src = src
                .replace(/("|'|\/)((?:\\\1|.)+?)\1|for\s*?\(.+?\)\s*?\{/g, function($0){
                    strings[strings.length] = $0;
                    return sid;
                });
            
            src = src.replace(/;/g, function(){
                    lIndex++;
                    return ';window["' + uid + '"](' + lIndex + ');';
                })
                .replace(RegExp(sid,'g'), function(){
                    return strings.shift();    
                });
                
            splitSRC = src.split(RegExp('window\\["' + uid + '\\"]\\(\\d+\\);'));
            
            return 'try { ' + src + '}catch(e){ window["' + uid + '"](e); }';
                
        });
        
        if (!errorFound) {
            modal.remove();
        }
    }
    
    /* Slightly adjusted version of "parseScripts": */
    function parseScripts(scriptType, parseFn) {
        
        var scripts = document.getElementsByTagName('script'),
            sLength = scripts.length,
            execute = function(parsed) {
                /* Execute parsed script in global context. */
                var dScript = document.createElement('script');
                try {
                    dScript.appendChild( document.createTextNode(parsed) );
                    document.body.appendChild(dScript);
                } catch(e) {
                    dScript.text = parsed;
                    document.getElementsByTagName('head')[0].appendChild(dScript);
                }
                dScript.parentNode.removeChild(dScript);
            };
        
        for (var i = 0; i < sLength; i++) {
            
            /* All script elements matching scriptType are passed to parseFn. */
            var script = scripts[i],
                type = script.type,
                code = script.innerHTML;
                
            if ( util.isSkippable(script) ) {
                continue;
            }
            
            if ( script.src === lintSrc || script.src === debugSrc ) {
                continue; /* We don't want to debug ourselves */
            }
            
            if (scriptType.test ? scriptType.test(type) : type === scriptType) {
                
                if (script.src) {
                    var extSource = extSources.get( script );
                    if (extSource) {
                        code = extSource;
                    } else {
                        var xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
                        try {
                            xhr.open('GET', script.src, false);
                            xhr.send(null);
                            code = xhr.responseText;
                            xhr = null;
                        } catch(e) { continue; }
                    }
                }
                if (!code) { continue; }
                execute(parseFn ? parseFn(code, script) : code);
            }
        }
        
    }
        
    function removeComments(str, removeCondComp) {
        str = ('__' + str + '__').split('');
        var mode = {
            singleQuote: false,
            doubleQuote: false,
            regex: false,
            blockComment: false,
            lineComment: false,
            condComp: false 
        };
        for (var i = 0, l = str.length; i < l; i++) {
            
            if (mode.regex) {
                if (str[i] === '/' && str[i-1] !== '\\') {
                    mode.regex = false;
                }
                continue;
            }
            
            if (mode.singleQuote) {
                if (str[i] === "'" && str[i-1] !== '\\') {
                    mode.singleQuote = false;
                }
                continue;
            }
            
            if (mode.doubleQuote) {
                if (str[i] === '"' && str[i-1] !== '\\') {
                    mode.doubleQuote = false;
                }
                continue;
            }
            
            if (mode.blockComment) {
                if (str[i] === '*' && str[i+1] === '/') {
                    str[i+1] = '';
                    mode.blockComment = false;
                }
                str[i] = '';
                continue;
            }
            
            if (mode.lineComment) {
                if (str[i+1] === '\n' || str[i+1] === '\r') {
                    mode.lineComment = false;
                }
                str[i] = '';
                continue;
            }
            
            if (mode.condComp) {
                if (str[i-2] === '@' && str[i-1] === '*' && str[i] === '/') {
                    mode.condComp = false;
                }
                continue;
            }
            
            mode.doubleQuote = str[i] === '"';
            mode.singleQuote = str[i] === "'";
            
            if (str[i] === '/') {
                
                if (str[i+1] === '*' && str[i+2] === '@') {
                    mode.condComp = true;
                    continue;
                }
                if (str[i+1] === '*') {
                    str[i] = '';
                    mode.blockComment = true;
                    continue;
                }
                if (str[i+1] === '/') {
                    str[i] = '';
                    mode.lineComment = true;
                    continue;
                }
                mode.regex = true;
                
            }
        
        }
        return str.join('').slice(2, -2);
    }
    
})();