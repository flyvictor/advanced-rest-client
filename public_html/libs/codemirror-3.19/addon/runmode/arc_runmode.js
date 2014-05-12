/**
 * This file has been modified for Advanced Rest Client.
 * 
 * @param {String} string Data to be parsed
 * @param {String} modespec Mode mime type.
 * @param {Function} callback A callback function called for each node.
 * @param {type} options
 * @returns {undefined}
 */
CodeMirror.runMode = function(string, modespec, callback, options) {
    var mode = CodeMirror.getMode(CodeMirror.defaults, modespec);

    if (callback.nodeType === 1) {
        var tabSize = (options && options.tabSize) || CodeMirror.defaults.tabSize;
        var node = callback, col = 0;
        node.innerHTML = "";
        callback = function(text, style) {
            if (text === "\n") {
                node.appendChild(document.createTextNode(text));
                col = 0;
                return;
            }
            var content = "";
            // replace tabs
            for (var pos = 0; ; ) {
                var idx = text.indexOf("\t", pos);
                if (idx === -1) {
                    content += text.slice(pos);
                    col += text.length - pos;
                    break;
                } else {
                    col += idx - pos;
                    content += text.slice(pos, idx);
                    var size = tabSize - col % tabSize;
                    col += size;
                    for (var i = 0; i < size; ++i)
                        content += " ";
                    pos = idx + 1;
                }
            }

            if (style) {
                var sp = node.appendChild(document.createElement("span"));
                sp.className = "cm-" + style.replace(/ +/g, " cm-");
                sp.appendChild(document.createTextNode(content));
            } else {
                node.appendChild(document.createTextNode(content));
            }
        };
    }

    var lines = CodeMirror.splitLines(string), state = CodeMirror.startState(mode);
    
    var i = 0, e = lines.length;
    var finish = function() {
        if (typeof options === "function") {
            options.call(window);
        }
    };
    
    var _parse = function() {
        if (i >= e) {
            finish();
            return;
        }
        //
        // Prohibit browser's hang on big amount of data.
        // Do it in setTimeout so the script will release event loop
        // and the task will be continued in next event loop.
        //
        setTimeout(function() {
            if (i) {
                callback("\n");
            }
            var stream = new CodeMirror.StringStream(lines[i]);
            while (!stream.eol()) {
                var style = mode.token(stream, state);
                callback(stream.current(), style, i, stream.start);
                stream.start = stream.pos;
            }
            i++;
            _parse();
        }, 0);
    };

    _parse();
};
