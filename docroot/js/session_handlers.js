/**
 * btnStart_click()
 * btnSet_click()
 * btnGet_click()
 */

function btnStart_click() {
	// Fuck IE.
	var xhrStart = new XMLHttpRequest();
	xhrStart.open('GET', ajaxUrl + "?action=session@renew", true);
	xhrStart.onerror = function(e){
		alert("Could not start a session.");
	};
	xhrStart.onreadystatechange = function() {
		if (xhrStart.readyState == 4) {
			document.getElementById("pSid").innerHTML = "Session ID: " + JSON.parse(xhrStart.responseText).sid;
		}
	};
	xhrStart.send(null);
}

function btnSet_click() {
	var xhrSet = new XMLHttpRequest();
	var key = document.getElementById("txtKey").value;
	var val = document.getElementById("txtData").value;
	xhrSet.open('GET', ajaxUrl + "?action=session@set&key=" + key + "&value=" + val, true);
	xhrSet.onerror = function(e) {
		alert("Could not set key.");
	};
	xhrSet.onreadystatechange = function(){};
	xhrSet.send(null);
}

function btnGet_click() {
	var xhrGet = new XMLHttpRequest();
	var key = document.getElementById("txtKeyGet").value;
	xhrGet.open('GET', ajaxUrl + "?action=session@get&key=" + key, true);
	xhrGet.onerror = function(e) {
		alert("Could not get key.");
	};
	xhrGet.onreadystatechange = function(){
		document.getElementById("pGet").innerHTML = "Value: " + JSON.parse(xhrGet.responseText).value;
	};
	xhrGet.send(null);
}

var ajaxUrl = "http://%SERVER_URL%:%LISTEN_PORT%";
