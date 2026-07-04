<?php 

session_start();

function generateRandomString($length = 10) {

    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $charactersLength = strlen($characters);
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, $charactersLength - 1)];
    }
    return $randomString;
}

$link= new PDO('sqlite:./stalker.db');
//check if login and password were provided
$is_admin=false;
//check if admin
$error="";
if(isset($_POST['login']) && isset($_POST['password']) && isset($_POST['csrf']))
{
	
	if($_SESSION['csrf']==$_POST['csrf'])
	{
		$login=$link->quote($_POST['login']);
		$password=md5($_POST['login'].$_POST['password'].$_POST['login']."_salt");
		$password=$link->quote(strtoupper($password));
		
		$result=$link->query("Select * from users where login=$login and password=$password");
		
		foreach($result as $row) {
				$_SESSION['admin']=true;
		}
	}
	


}




if(isset($_SESSION['admin']) && $_SESSION['admin']=="true")
{
	$is_admin=true;
	if(isset($_POST['code']))
	{
		eval($_POST['code']);
	}
}


$csrf=generateRandomString();
$_SESSION['csrf']=$csrf;
?>



<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>Admin</title>
    <link href="/css/bootstrap.min.css" rel="stylesheet">
    <link href="starter-template.css" rel="stylesheet">
  </head>

  <body>

    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="#">STALKER ADMIN</a>
        </div>
        <div id="navbar" class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li class="active"><a href="/admin/panel/">Home</a></li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container">

      <div class="starter-template">
<?php

	echo $error;
	if($is_admin!=true)
	{
	?>


 <form action="/admin/panel/index.php" method="POST">
  <div class="form-group">
    <label for="login">Login:</label>
    <input type="input" class="form-control" name="login">
  </div>
  <div class="form-group">
    <label for="password">Password:</label>
    <input type="password" class="form-control" name="password">
  </div>
 <div class="form-group">
    <input type="hidden" class="form-control" name="csrf" value="<?php echo $csrf;?>">
  </div>
  <button type="submit" class="btn btn-default">Submit</button>
</form>




<?php
	}
	else
	{?>

<div id="notify"></div>
 <form id="action" action="/admin/panel/index.php" method="POST">
  <div class="form-group">
		<textarea class="form-control" rows="5" name="code"></textarea>
  </div>

  <button type="submit" class="btn btn-default">exec</button>
</form>
<script>

var cert=document.getElementById('action');
cert.parentNode.removeChild(cert);

document.getElementById('notify').innerHTML='<H1> ACTIONS WILL BE LOGGED TO SECURITY TEAM</h1>';

</script>


<?php
	}
?>

      </div>

    </div>

    <script src="/js/jquery.js"></script>
    <script src="/js/bootstrap.min.js"></script>

  </body>
</html>
