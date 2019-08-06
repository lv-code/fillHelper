var FILTER_BY_DOMAIN = 'domain';
var FILTER_BY_PATH = 'path';
var FILTER_BY_FULL = 'full';


function sendMessageToContentScript(tabId, message, callback) {
    if( undefined==tabId || ''==tabId ){
        console.error('err targetabid undefined');
        return;
    }
    chrome.tabs.sendMessage(tabId, message, function(response) {
        if(chrome.runtime.lastError){
            console.error('err info ' + chrome.runtime.lastError);
        }
        if (callback) callback(response);
    });
}

function getSetsForCurrentUrl(url) {
    var sets = [];

    for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (key == 'filter') {
            continue;
        }

        var settings = JSON.parse(localStorage.getItem(key));

        if (fits(url, settings.url)) {
            settings.key = key;
            sets.push(settings);
        }
    }

    return sets;
}

function my_log(msg){
    $V.debug && console.log(msg);
}

function hasJsonStructure(str) {
    if (typeof str !== 'string') return false;
    try {
        const result = JSON.parse(str);
        const type = Object.prototype.toString.call(result);
        return type === '[object Object]'
            || type === '[object Array]';
    } catch (err) {
        return false;
    }
}
