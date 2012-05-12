/**
 * btnSubmit_click()
 */

function btnSubmit_click() {
	if (!$('#optUseDefaults').val()) {
		$.ajax({
			url:ajaxUrl,
			type:"GET",
			dataType:"json",
			data:{
				"action":"mysql@query",
				"host":$("#txtHost").val(),
				"port":$("#txtPort").val(),
				"user":$("#txtUser").val(),
				"password":$("#txtPassword").val(),
				"database":$("#txtDatabase").val(),
				"query":$("#txtQuery").val()
			},
			success:function(data, status, xhr) {
				$("#pResults").text(JSON.stringify(data));
			},
			error:function(xhr, status, error) {
				alert("Error");
			}
		});
	} else {
		$.ajax({
			url:ajaxUrl,
			type:"GET",
			dataType:"json",
			data:{
				"action":"mysql@query",
				"query":$("#txtQuery").val()
			},
			success:function(data, status, xhr) {
				$("#pResults").text = JSON.stringify(data);
			},
			error:function(xhr, status, error) {
				alert("Error");
			}
		});
	}
}

var ajaxUrl = "http://localhost:12321";
