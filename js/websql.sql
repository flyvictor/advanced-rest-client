CREATE TABLE request_data (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, project INTEGER DEFAULT 0, name TEXT NOT NULL, url TEXT NOT NULL, method TEXT NOT NULL, encoding TEXT NULL, headers TEXT NULL, payload TEXT NULL, skipProtocol INTEGER DEFAULT 0, skipServer INTEGER DEFAULT 0, skipParams INTEGER DEFAULT 0, skipHistory INTEGER DEFAULT 0, skipMethod INTEGER DEFAULT 0, skipPayload INTEGER DEFAULT 0, skipHeaders INTEGER DEFAULT 0, skipPath INTEGER DEFAULT 0, time INTEGER);
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","aaaa","http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?v=2&alt=json&feature=plcp&a=czesc+pawel+%2B+to+ja","GET","application/x-www-form-urlencoded","Accept: ","null","0","0","0","0","0","0","0","0","1374770585509");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","aaaa","http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?v=2&alt=json&feature=plcp&a=czesc+pawel+%2B+to+ja","GET","application/x-www-form-urlencoded","Accept: 
","","0","0","0","0","0","0","0","0","1374879576811");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","empty2","https://accounts.google.com/o/oauth2/token","GET","application/x-www-form-urlencoded","A: b
","","0","0","0","0","0","0","0","0","1374879576811");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Quee - send profile reg data","http://quee.pl/profiles/save.json","POST","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
","_method=PUT&data%5BUser%5D%5Bid%5D=1&data%5BProfile%5D%5Bid%5D=&data%5BUser%5D%5Blast_name%5D=Pszty%C4%87&data%5BUser%5D%5Bnick%5D=jarrodek&data%5BProfile%5D%5Bcity%5D=Warszawa&data%5BProfile%5D%5Bcountry%5D=Poland&data%5BProfile%5D%5Bsex%5D=&data%5BProfile%5D%5Bbirthday%5D%5Bday%5D=20&data%5BProfile%5D%5Bbirthday%5D%5Bmonth%5D=10&data%5BProfile%5D%5Bbirthday%5D%5Byear%5D=1983&data%5BProfile%5D%5Bshowbirthdate%5D=0&data%5BProfile%5D%5Bhidebirthyear%5D=0","0","0","0","0","0","0","0","0","1374879576811");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Xyz","http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?alt=json&feature=plcp&enc=a+b+c+d#aaaa","OPTIONS","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
User-Agent: MyUserAgent
Referer: http://www.google.pl
Accept-Language: en-US
Connection: close
Cache-Control: public
","","0","0","0","0","0","0","0","0","1374879576811");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","aaaAAAaaa","http://localhost/a/index.php","POST","multipart/form-data","Accept: */*
Accept-Language: pl,en-US;q=0.8,en;q=0.6
","--AaB03x
content-disposition: form-data; name=\"field1\"

$field1
--AaB03x
content-disposition: form-data; name=\"field2\"

$field2
--AaB03x
content-disposition: form-data; name=\"userfile\"; filename=\"$filename\"
Content-Type: $mimetype
Content-Transfer-Encoding: binary

$binarydata
--AaB03x--","0","0","0","0","0","0","0","0","1374879576811");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Files TEST","http://localhost/a/index.php","POST","application/x-www-form-urlencoded","Accept: */*
Accept-Language: pl,en-US;q=0.8,en;q=0.6
Content-Type: multipart/form-data; boundary=AaB03x
","--AaB03x
content-disposition: form-data; name="field1"

$field1
--AaB03x
content-disposition: form-data; name="field2"

$field2
--AaB03x
content-disposition: form-data; name="userfile"; filename="$filename"
Content-Type: $mimetype
Content-Transfer-Encoding: binary

$binarydata
--AaB03x--","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Filea wfdzadfs TEST","http://localhost/a/index.php","POST","application/x-www-form-urlencoded","Accept: */*
Accept-Language: pl,en-US;q=0.8,en;q=0.6
Content-Type: multipart/form-data; boundary=AaB03x
","--AaB03x
content-disposition: form-data; name="field1"

$field1
--AaB03x
content-disposition: form-data; name="field2"

$field2
--AaB03x
content-disposition: form-data; name="userfile"; filename="$filename"
Content-Type: $mimetype
Content-Transfer-Encoding: binary

$binarydata
--AaB03x--","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","mobilnyExpress","http://irasiad.kalicinscy.com/ExpressRent.mobi/jsonapi/getLocations.json?lang=pl","GET","application/x-www-form-urlencoded","null","a: b","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Irasiad","http://irasiad.kalicinscy.com/ExpressRent.mobi/jsonapi/getLocations.json?lang=pl","GET","application/x-www-form-urlencoded","If-Modified-Since: 
","a: b","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Gazeta","http://www.gazeta.pl","GET","application/x-www-form-urlencoded","If-Modified-Since: 
","a: b","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Files TEST","http://localhost/a/index.php","POST","application/x-www-form-urlencoded","Accept: */*
Accept-Language: pl,en-US;q=0.8,en;q=0.6
Content-Type: multipart/form-data; boundary=AaB03x
","--AaB03x
content-disposition: form-data; name="field1"

$field1
--AaB03x
content-disposition: form-data; name="field2"

$field2
--AaB03x
content-disposition: form-data; name="userfile"; filename="$filename"
Content-Type: $mimetype
Content-Transfer-Encoding: binary

$binarydata
--AaB03x--","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","MyRequest","http://localhost/a/index.php","POST","application/x-www-form-urlencoded","Accept: */*
Accept-Language: pl,en-US;q=0.8,en;q=0.6
Content-Type: application/x-www-form-urlencoded
","--AaB03x
content-disposition: form-data; name="field1"

$field1
--AaB03x
content-disposition: form-data; name="field2"

$field2
--AaB03x
content-disposition: form-data; name="userfile"; filename="$filename"
Content-Type: $mimetype
Content-Transfer-Encoding: binary

$binarydata
--AaB03x--","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","mobilnyExpress","http://irasiad.kalicinscy.com/ExpressRent.mobi/jsonapi/getLocations.json?lang=pl","GET","application/x-www-form-urlencoded","null","a: b","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","test3","http://quee.pl/profiles/ua","POST","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
Accept: a
If-Modified-Since: Thu, 12 Jan 2012 15:15:59 UTC+1
xcvzxcvzxc: xzcvxzcv
Content-Type: application/x-www-form-urlencoded
","_method=PUT&data%5BUser%5D%5Bid%5D=1&data%5BProfile%5D%5Bid%5D=&data%5BUser%5D%5Blast_name%5D=Pszty%C4%87&data%5BUser%5D%5Bnick%5D=jarrodek&data%5BProfile%5D%5Bcity%5D=Warszawa&data%5BProfile%5D%5Bcountry%5D=Poland&data%5BProfile%5D%5Bsex%5D=&data%5BProfile%5D%5Bbirthday%5D%5Bday%5D=20&data%5BProfile%5D%5Bbirthday%5D%5Bmonth%5D=10&data%5BProfile%5D%5Bbirthday%5D%5Byear%5D=1983&data%5BProfile%5D%5Bshowbirthdate%5D=0&data%5BProfile%5D%5Bhidebirthyear%5D=0","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","zzzzz","http://serwisy.gazeta.pl/","GET","application/x-www-form-urlencoded","a: b
c: d
","","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","TEST2","http://quee.pl/profiles/ua","POST","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
Accept: a
If-Modified-Since: Thu, 12 Jan 2012 15:15:59 UTC+1
","_method=PUT&data%5BUser%5D%5Bid%5D=1&data%5BProfile%5D%5Bid%5D=&data%5BUser%5D%5Blast_name%5D=Pszty%C4%87&data%5BUser%5D%5Bnick%5D=jarrodek&data%5BProfile%5D%5Bcity%5D=Warszawa&data%5BProfile%5D%5Bcountry%5D=Poland&data%5BProfile%5D%5Bsex%5D=&data%5BProfile%5D%5Bbirthday%5D%5Bday%5D=20&data%5BProfile%5D%5Bbirthday%5D%5Bmonth%5D=10&data%5BProfile%5D%5Bbirthday%5D%5Byear%5D=1983&data%5BProfile%5D%5Bshowbirthdate%5D=0&data%5BProfile%5D%5Bhidebirthyear%5D=0","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","File in body","http://localhost/a/index.php","POST","multipart/form-data","Accept: */*
Accept-Language: pl,en-US;q=0.8,en;q=0.6
Content-Type: multipart/form-data; boundary=AaB03x
","--AaB03x
content-disposition: form-data; name="field1"

$field1
--AaB03x
content-disposition: form-data; name="field2"

$field2
--AaB03x
content-disposition: form-data; name="userfile"; filename="$filename"
Content-Type: $mimetype
Content-Transfer-Encoding: binary

$binarydata
--AaB03x--","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","a","http://127.0.1.1:8888/ext-channel?p=g&uid=447705BE-3ADD-4E28-8615-451B85360647","POST","application/x-www-form-urlencoded","null","","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","PUT request forms data to DEV srv","http://127.0.0.1:8888/ext-channel/put","POST","application/json","Content-Type: application/json
","{"d":[{"n":"FILE FORM via headers set", "d":{"url":"http://127.0.0.1/a/index.php", "post":"------WebKitFormBoundaryHD2Hr1gZkSTLb8gL\nContent-Disposition: form-data; name=\"fileUpload\"; filename=\"post.txt\"\nContent-Type: text/plain\n\n\n------WebKitFormBoundaryHD2Hr1gZkSTLb8gL--", "method":"POST", "formEncoding":"multipart/form-data", "headers":[{"Accept":"*/*"},{"Accept-Language":"pl,en-US;q=0.8,en;q=0.6"}]}, "i":5},{"n":"NACL test", "d":{"url":"http://127.0.0.1/a/nacl/geturl/geturl.html", "post":"", "method":"GET", "formEncoding":"application/x-www-form-urlencoded", "headers":[]}, "i":15},{"n":"T-GET", "d":{"url":"http://localhost/a/t.php", "post":"", "method":"GET", "formEncoding":"application/x-www-form-urlencoded", "headers":[]}, "i":16},{"n":"T-GET_Ajax", "d":{"url":"http://localhost/a/t.php", "post":"", "method":"GET", "formEncoding":"application/x-www-form-urlencoded", "headers":[{"X-Requested-With":"HttpXMLRequest"}]}, "i":17},{"n":"T-POST-AJAX", "d":{"url":"http://localhost/a/t.php", "post":"", "method":"POST", "formEncoding":"application/x-www-form-urlencoded", "headers":[{"X-Requested-With":"HttpXMLRequest"}]}, "i":9},{"n":"T-POST-null", "d":{"url":"http://localhost/a/t.php", "post":"", "method":"POST", "formEncoding":"application/x-www-form-urlencoded", "headers":[]}, "i":8},{"n":"T_Options", "d":{"url":"http://localhost/a/t.php", "post":"", "method":"OPTIONS", "formEncoding":"application/x-www-form-urlencoded", "headers":[{"s":""}]}, "i":12},{"n":"aa", "d":{"url":"/test?p=json2", "post":"", "method":"GET", "formEncoding":"application/x-www-form-urlencoded", "headers":[{"Authorization":""}]}, "i":3},{"n":"aaaa", "d":{"url":"http://127.0.0.1/a/index.php?verylongvariablename=verylongvariablevalue&ver…iablevalueverylongvariablevalue&verylongvariablename=verylongvariablevalue", "post":"--AaB03x\ncontent-disposition: form-data; name=\"field1\"\n\n$field1\n--AaB03x\ncontent-disposition: form-data; name=\"field2\"\n\n$field2\n--AaB03x\ncontent-disposition: form-data; name=\"userfile\"; filename=\"$filename\"\nContent-Type: $mimetype\nContent-Transfer-Encoding: binary\n\n$binarydata\n--AaB03x--", "method":"POST", "formEncoding":"multipart/form-data", "headers":[{"Accept":"*/*"},{"Accept-Language":"pl,en-US;q=0.8,en;q=0.6"},{"Content-Type":"multipart/form-data; boundary=AaB03x"}]}, "i":6},{"n":"bezsens", "d":{"url":"http://google.com", "post":"", "method":"GET", "formEncoding":"application/x-www-form-urlencoded", "headers":[{"s":"a"},{"Cache-Control":"d"},{"e":"s"}]}, "i":13},{"n":"l", "d":{"url":"/test?p=json", "post":"", "method":"GET", "formEncoding":"application/x-www-form-urlencoded", "headers":[{"Authorization":"Basic YTpi"}]}, "i":4}], "i":"447705BE-3ADD-4E28-8615-451B85360647"}","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Quee - send profile reg data","http://quee.pl/profiles/save.json","POST","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
","_method=PUT&data%5BUser%5D%5Bid%5D=1&data%5BProfile%5D%5Bid%5D=&data%5BUser%5D%5Blast_name%5D=Pszty%C4%87&data%5BUser%5D%5Bnick%5D=jarrodek&data%5BProfile%5D%5Bcity%5D=Warszawa&data%5BProfile%5D%5Bcountry%5D=Poland&data%5BProfile%5D%5Bsex%5D=&data%5BProfile%5D%5Bbirthday%5D%5Bday%5D=20&data%5BProfile%5D%5Bbirthday%5D%5Bmonth%5D=10&data%5BProfile%5D%5Bbirthday%5D%5Byear%5D=1983&data%5BProfile%5D%5Bshowbirthdate%5D=0&data%5BProfile%5D%5Bhidebirthyear%5D=0","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Irasiad","http://irasiad.kalicinscy.com/ExpressRent.mobi/jsonapi/getLocations.json?lang=pl","GET","application/x-www-form-urlencoded","If-Modified-Since: 
","a: b","0","0","0","0","0","0","0","0","1374879613832");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","TEST2","http://quee.pl/profiles/ua","POST","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
Accept: a
If-Modified-Since: Thu, 12 Jan 2012 15:15:59 UTC+1
","_method=PUT&data%5BUser%5D%5Bid%5D=1&data%5BProfile%5D%5Bid%5D=&data%5BUser%5D%5Blast_name%5D=Pszty%C4%87&data%5BUser%5D%5Bnick%5D=jarrodek&data%5BProfile%5D%5Bcity%5D=Warszawa&data%5BProfile%5D%5Bcountry%5D=Poland&data%5BProfile%5D%5Bsex%5D=&data%5BProfile%5D%5Bbirthday%5D%5Bday%5D=20&data%5BProfile%5D%5Bbirthday%5D%5Bmonth%5D=10&data%5BProfile%5D%5Bbirthday%5D%5Byear%5D=1983&data%5BProfile%5D%5Bshowbirthdate%5D=0&data%5BProfile%5D%5Bhidebirthyear%5D=0","0","0","0","0","0","0","0","0","1374879635139");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","test3","http://quee.pl/profiles/ua","POST","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
Accept: a
If-Modified-Since: Thu, 12 Jan 2012 15:15:59 UTC+1
xcvzxcvzxc: xzcvxzcv
Content-Type: application/x-www-form-urlencoded
","_method=PUT&data%5BUser%5D%5Bid%5D=1&data%5BProfile%5D%5Bid%5D=&data%5BUser%5D%5Blast_name%5D=Pszty%C4%87&data%5BUser%5D%5Bnick%5D=jarrodek&data%5BProfile%5D%5Bcity%5D=Warszawa&data%5BProfile%5D%5Bcountry%5D=Poland&data%5BProfile%5D%5Bsex%5D=&data%5BProfile%5D%5Bbirthday%5D%5Bday%5D=20&data%5BProfile%5D%5Bbirthday%5D%5Bmonth%5D=10&data%5BProfile%5D%5Bbirthday%5D%5Byear%5D=1983&data%5BProfile%5D%5Bshowbirthdate%5D=0&data%5BProfile%5D%5Bhidebirthyear%5D=0","0","0","0","0","0","0","0","0","1374879635139");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","Irasiad","http://irasiad.kalicinscy.com/ExpressRent.mobi/jsonapi/getLocations.json?lang=pl","GET","application/x-www-form-urlencoded","If-Modified-Since: 
","a: b","0","0","0","0","0","0","0","0","1374879635139");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","XML Example","http://www.w3schools.com/xml/simple.xml","GET","application/x-www-form-urlencoded","null","","0","0","0","0","0","0","0","0","1374879635139");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","dev","http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?alt=json&feature=plcp&enc=a+b+c+d#aaaa","OPTIONS","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
User-Agent: MyUserAgent
Referer: http://www.google.pl
Accept-Language: en-US
Connection: close
Cache-Control: public
","","0","0","0","0","0","0","0","0","1374879635139");
INSERT INTO request_data(project,name,url,method,encoding,headers,payload,skipProtocol,skipServer,skipParams,skipHistory,skipMethod,skipPayload,skipHeaders,skipPath,time) VALUES ("0","dev","http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?alt=json&feature=plcp&enc=a+b+c+d#aaaa","OPTIONS","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest\nUser-Agent: MyUserAgent\nReferer: http://www.google.pl\nAccept-Language: en-US\nConnection: close\nCache-Control: public","","0","0","0","0","0","0","0","0","1374879635139"); 





CREATE TABLE exported (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, reference_id INTEGER NOT NULL, gaeKey TEXT, type TEXT default 'form');
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("1","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjxqAIM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("2","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjxqAIM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("3","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRihmQIM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("4","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiLpAEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("5","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiMpAEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("6","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiNpAEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("7","ahJzfmNocm9tZXJlc3RjbGllbnRyMwsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRgBDA","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("8","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRihHww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("9","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiiHww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("10","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRi6Fww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("11","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjSDww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("12","ahJzfmNocm9tZXJlc3RjbGllbnRyMwsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRgDDA","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("13","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiKJww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("14","ahJzfmNocm9tZXJlc3RjbGllbnRyMwsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRgFDA","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("15","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjcNgw","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("16","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRj2Lgw","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("17","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRj0Lgw","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("18","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjzLgw","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("19","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiMJww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("20","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRiLJww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("21","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjtBww","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("22","ahJzfmNocm9tZXJlc3RjbGllbnRyNAsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjBPgw","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("23","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjDuwEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("24","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjIuwEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("25","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRj60gEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("26","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjL4gEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("27","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjN4gEM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("1","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjxqAIM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("1","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjxqAIM","form");
INSERT INTO exported(reference_id,gaeKey,type) VALUES ("1","ahJzfmNocm9tZXJlc3RjbGllbnRyNQsSB0FwcFVzZXIiFTExNzMwODUxODU1MTI3Mzk0Mzg5MQwLEgtSZXF1ZXN0SXRlbRjxqAIM","form");

CREATE TABLE history (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, url TEXT NOT NULL, method TEXT NOT NULL, encoding TEXT NULL, headers TEXT NULL, payload TEXT NULL, time INTEGER);
INSERT INTO history(url,method,encoding,headers,payload,time) VALUES ("http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?v=2&alt=json&feature=plcp&a=czesc+pawel+%2B+to+ja","GET","application/x-www-form-urlencoded","Accept: ","null","1374770519792");
INSERT INTO history(url,method,encoding,headers,payload,time) VALUES ("http://irasiad.kalicinscy.com/ExpressRent.mobi/jsonapi/getLocations.json?lang=pl","GET","application/x-www-form-urlencoded","If-Modified-Since: ","null","1374880069500");
INSERT INTO history(url,method,encoding,headers,payload,time) VALUES ("http://serwisy.gazeta.pl/","GET","application/x-www-form-urlencoded","a: b
c: d","null","1374880082450");
INSERT INTO history(url,method,encoding,headers,payload,time) VALUES ("http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?alt=json&feature=plcp&enc=a+b+c+d#aaaa","OPTIONS","application/x-www-form-urlencoded","X-Requested-With: XMLHttpRequest
User-Agent: MyUserAgent
Referer: http://www.google.pl
Accept-Language: en-US
Connection: close
Cache-Control: public
Content-Type: application/x-www-form-urlencoded","","1374880097946");
INSERT INTO history(url,method,encoding,headers,payload,time) VALUES ("https://accounts.google.com/o/oauth2/token","GET","application/x-www-form-urlencoded","A: b","null","1374880110857");
INSERT INTO history(url,method,encoding,headers,payload,time) VALUES ("http://gdata.youtube.com/feeds/api/playlists/56D792A831D0C362/?v=2&alt=json&feature=plcp&a=czesc+pawel+%2B+to+ja","GET","application/x-www-form-urlencoded","Accept: ","null","1374770519792"); 