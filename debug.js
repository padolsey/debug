/*
 
    DEBUG.js
    (c) James Padolsey
    http://james.padolsey.com
    
    DEBUG.js is an in-browser JavaScript error-reporter
    Read README.txt for instructions
 
*/


(function(){
    
    var strictCommenting = true;
    
    // Load JSLINT, don't start until we've got it!
    var lint = document.createElement('script'),
        sInt = setInterval(function(){
            if (window.JSLINT) {
                clearInterval(sInt);
                init();
            }
        }, 100);
        
    lint.src = 'http://www.jslint.com/fulljslint.js';
    document.body.appendChild(lint);
    
    // Overlaying document; where the errors are displayed.
    var modal = (function(){
        // Modal interface.
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
                fontSize: '20px'
            }),
            nextGroup = list;
              
        mainHeading.innerHTML = 'syntax/runtime errors in your JavaScript';
        overlay.appendChild(mainHeading);
        
        var run = false;
        return {
            add : function(text, error) {
                // Only inject the "modal" if this function is called: (for the 1st time):
                if (!run) {
                    document.documentElement.style.height = document.body.style.height =
                    document.documentElement.style.width = document.body.style.width = '100%';
                    document.documentElement.style.overflow = document.body.style.overflow = 'hidden';
                    overlay.style.display = 'block';
                    overlay.appendChild(list);
                    document.body.appendChild(overlay);
                    run = true;
                }
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
                    var evidence = error.evidence;
                    pre.innerHTML = error.character && error.character < error.evidence.length ? ([
                        evidence.substring(0, error.character),
                         '<span style="padding:5px;background:pink;">',
                         evidence.charAt(error.character),
                         '</span>',
                         evidence.substring(error.character + 1)
                    ].join('')) : error.evidence;
                    // Replace leading/trailing whitespace
                    pre.innerHTML = pre.innerHTML.replace(/^[^\S][^\S]*|[^\S][^\S]*$/g, '').replace(/(\n\r|\n)/g, '<br/>');
                    li.appendChild(pre);
                }
                li.innerHTML = text + li.innerHTML;
                nextGroup.appendChild(li);
            },
            newGroup : function(scriptID, src) {
                nextGroup = style(document.createElement('div'), {
                    background: '#FAFFA7',
                    margin: '0 0 15px 0',
                    padding: '10px'
                });
                var heading = style(document.createElement('h3'), {
                    color: 'black',
                    padding: '5px',
                    margin: '0 0 10px 0',
                    fontSize: '15px',
                    textAlign: 'left',
                    borderBottom: '1px solid black'
                });
                heading.innerHTML = 'Script ID: "' + scriptID + '"';
                if (src) {
                    heading.innerHTML += ' <small>[' + src + ']</small>';
                }
                nextGroup.appendChild(heading);
                list.appendChild(nextGroup);
            }
        }
    })();
    
    function init() {
        
        var runLint = true,
            uid = +(new Date()),
            debugPatt = /:debug\((.+?)\)$/,
            jsLintErrors = false;
    
        parseScripts(/:debug\((.+?)\)$/, function(src, scriptEl){
            
            var strings = [],
                sid = '_' + (+new Date()),
                lIndex = 0,
                recovered = 0,
                splitSRC,
                scriptID = scriptEl.type.match(/:debug\((.+?)\)$/)[1] || 'NULL';
                
            window[uid] = function(e) {
                if (!isNaN(e)) {
                    recovered++;
                } else {
                    modal.add('ERROR (<small>SCRIPT "' +scriptID+ '", STATEMENT: ' + (recovered+1) + '</small>): ' + e.message, {
                        // Replace blank lines (replace(...))
                        evidence: splitSRC[recovered].replace(/[\n\r]\s+(?=[\n\r])/, '')//.replace(/^.+?\{(?=(.|[\n\r])+)/,'')
                    });
                }
            };
            
            modal.newGroup(scriptID, scriptEl.getAttribute('src'));
            
            if (runLint) {
                JSLINT(src);
                for (var error in JSLINT.errors) {
                    jsLintErrors = true;
                    var thisError = JSLINT.errors[error];
                    if (thisError) {
                        modal.add([
                            '<a style="color:black;" href="http://jslint.com/" target="_blank">JSLINT</a> (<small>SCRIPT "',
                            scriptID,
                            '", LINE ',
                            thisError.line,
                            ', CHARACTER ',
                            thisError.character,
                            '</small>): ',
                            (thisError.reason)
                        ].join(''), thisError);
                    }
                }
            }
            
            if (jsLintErrors) { return ''; }
            
            // Remove ALL comments
            src = strictCommenting ? removeComments(src, true) : src.replace(/\/\*.+?\*\/|\/\/.+?(?=[\n\r])/g, '');
        
            // Replace strings, Replace each end-of-line with window.uid call.
            src = src
                .replace(/("|'|\/)((?:\\\1|.)+?)\1/g, function($0){
                    strings[strings.length] = $0;
                    return sid;
                });
            
            src = src.replace(/;/g, function(){
                    lIndex++;
                    return ';window[' + uid + '](' + lIndex + ');'
                })
                .replace(RegExp(sid,'g'), function(){
                    return strings.shift();    
                });
                
            splitSRC = src.split(RegExp(';window\\[' + uid + '\\]\\(\\d+\\);'));
            
            return 'try { ' + src + '}catch(e){ window[' + uid + '](e); }';
                
        });
    }
    
    // Slightly adjusted version of "parseScripts":
    function parseScripts(scriptType, parseFn) {
        
        var scripts = document.getElementsByTagName('script'),
            sLength = scripts.length,
            execute = function(parsed) {
                // Execute parsed script in global context.
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
            // All script elements matching scriptType are passed to parseFn.
            var script = scripts[i],
                type = script.type,
                code = script.innerHTML;
            if (scriptType.test ? scriptType.test(type) : type === scriptType) {
                
                if (script.src) {
                    var xhr = window.ActiveXObject ? new ActiveXObject("Microsoft.XMLHTTP") : new XMLHttpRequest();
                    xhr.open('GET', script.src, false);
                    xhr.send(null);
                    code = xhr.responseText;
                    xhr = null;
                }
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