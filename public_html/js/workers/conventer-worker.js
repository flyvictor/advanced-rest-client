/* 
 * Copyright 2014 jarrod.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


self.onmessage = function(e) {
    var data = e.data;
    
    switch(data.type){
        case 'curl':
            getAsCurl(data.http);
            break;
            
    }
};

function getAsCurl(requestData){
    var headers_to_commands = ['user-agent','accept-encoding'];
    var cmd = "curl '";
    //url
    cmd += requestData.url + "' ";
    //add headers
    var pending_commands = [];
    
    for(var key in requestData.headers){
        var _header_value = requestData.headers[key];
        var header = {
            'name': key,
            'value': _header_value
        };
        if(headers_to_commands.indexOf(header.name.toLowerCase()) !== -1){
            var parsed = parseHeaderToCommand(header);
            pending_commands[pending_commands.length] = parsed[0];
            header = parsed[1];
            if(header === null) continue;
            cmd += "-H '";
            cmd += header;
            cmd += "' ";
        } else {
            cmd += "-H '";
            cmd += header.name + ': ' + header.value;
            cmd += "' ";
        }
    }
    
    //add commands
    for(var i=0, len=pending_commands.length; i<len; i++){
        var command = pending_commands[i];
        cmd += command + " ";
    }
    var noPayloadMethods = ['get', 'options', 'delete'];
    //post data?
    if(noPayloadMethods.indexOf(requestData.method) === -1){
        cmd += "--data '";
        cmd += requestData.payload || '';
        cmd += "'";
    }
    
    
    self.postMessage(cmd);
};
/**
 * Some of the headers have representation in command switchers. 
 * For example 'User-Agent' headers is --user-agent "agent string" option.
 * THer's no need to set 'User-Agent' header at the time.
 * However, accept-encoding header may trigger use of --compressed option
 * and the header still should be sent. 
 * 
 * @param {Object} header Header object with 'name' and 'value' keys.
 * @returns {Array} First item is a command to append. Second item is a header value. If header should not be set it will be set to null.
 */
function parseHeaderToCommand(header){
    var command = null, _header = null;
    switch(header.name){
        case 'accept-encoding': 
            command = '--compressed';
            _header = header.name + ': ' + header.value;
            break;
        case 'user-agent': 
            command = '--user-agent "' + header.value + '"';
            _header = null;
            break;
    }
    
    return [command,_header];
}
