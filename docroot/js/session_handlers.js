/**
 * btnStart_click()
 * btnSet_click()
 * btnGet_click()
 * btnSave_click()
 * btnSnapshot_click()
 */

function btnStart_click() {
	$.ajax({
		url:ajaxUrl,
		type:"GET",
		dataType:"json",
		data:{
			"action":"session@renew"
		},
		success:function(data, status, xhr) {
			$("#pSid").text("Session ID: " + data.sid);
		},
		error:function(xhr, status, error) {
			alert(error + "\n" + status + "\n" + JSON.stringify(xhr));
		}
	});
}

function btnSet_click() {
	$.ajax({
		url:ajaxUrl,
		type:"GET",
		dataType:"json",
		data:{
			"action":"session@set",
			"key":$("#txtKey").val(),
			"value":$("#txtData").val()
		},
		success:function(data, status, xhr) {
			// Do nothing
		},
		error:function(xhr, status, error) {
			alert(error);
		}
	});
}

function btnGet_click() {
	$.ajax({
		url:ajaxUrl,
		type:"GET",
		dataType:"json",
		data:{
			"action":"session@get",
			"key":$("#txtKeyGet").val()
		},
		success:function(data, status, xhr) {
			$("#pGet").text(data.value);
		},
		error:function(xhr, status, error) {
			alert(error);
		}
	});
}

function btnSave_click() {
	$.ajax({
		url:ajaxUrl,
		type:"GET",
		dataType:"json",
		data:{
			"action":"session@savecache"
		},
		success:function(data, status, xhr) {
			$("#pStatus").text("Saved the session cache to disk.");
		},
		error:function(xhr, status, error) {
			$("#pStatus").text("Error saving the session cache.");
		}
	});
}

function btnSnapshot_click() {
	$.ajax({
		url:ajaxUrl,
		type:"GET",
		dataType:"json",
		data:{
			"action":"session@savesnapshot",
			"label":$("#txtLabel").val()
		},
		success:function(data, status, xhr) {
			$("#pStatus").text("Saved the snapshot.");
		},
		error:function(xhr, status, error) {
			$("#pStatus").text("Error saving the snapshot.");
		}
	});
}

var ajaxUrl = "http://localhost:12321";
