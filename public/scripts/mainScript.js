$(document).ready(function(){

    //LOGIN ... client
    $("#loginBtn").click(function(){

        var username = document.getElementsByName("username")[0].value;
        var pswd = document.getElementsByName("password")[0].value;
    
        const url = document.URL;
        var naslov = url.split("/")[0];

        let data = {
            username:username,
            password:pswd
        }

        $.ajax({
            url: naslov + "/user/login",
            type: 'POST',
            data: data,

            success: function(res)
            {
                //alert(res);           
                window.location = naslov + "/user/profile";
                localStorage.setItem('jwt', res.jwt);
            },
            error: function (xhr, ajaxOptions, thrownError) 
            {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });

    ///user/connect
    $("#connectBtn").click(function(){

        var IP = document.getElementsByName("IP")[0].value;
        var port = document.getElementsByName("port")[0].value;
        var data = document.getElementsByName("data")[0].value;

        alert("connect");
        alert(IP + ":" + port + " " + data);

        const url = document.URL;
        var naslov = url.split("/")[0];

        let mydata = {
            IP:IP,
            port:port,
            data:data
        }

        $.ajax({
            url: naslov + "/user/connect",
            type: 'POST',
            data: mydata,

            success: function(res)
            {          
                window.location = naslov + "/";
            },
            error: function (xhr, ajaxOptions, thrownError) 
            {
                alert(xhr.status);
                alert(thrownError);
            }
        })
    });
});