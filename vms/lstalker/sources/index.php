<?php

session_start();
$link= new PDO('sqlite:./stalker.db');

?>



<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    <title>BEST CAT SITE IN NET</title>
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
          <a class="navbar-brand" href="#">STALKER CATS</a>
        </div>
        <div id="navbar" class="collapse navbar-collapse">
          <ul class="nav navbar-nav">
            <li class="active"><a href="/">Home</a></li>
          </ul>
        </div>
      </div>
    </nav>

    <div class="container">

      <div class="starter-template">
	<?php
	
	if(isset($_GET['id']))
	{
		
		$id=$_GET['id'];
		$result=$link->query("select id,source from pictures where id=$id");
	
	}
	else
	{
		$result=$link->query("select id,source from pictures order by id desc");
	}

	foreach($result as $row) {

?>
	   <div class="panel panel-default">
	  <div class="panel-heading">
	    <h3 class="panel-title"><a href="/?id=<?php echo $row['id'];?>">view</a></h3>
	  </div>
	  <div class="panel-body">
	   <img src="/pic/<?php echo $row['source'];?>">
	  </div>
	</div>
	<?php
}
?>

      </div>

    </div>

    <script src="/js/jquery.js"></script>
    <script src="/js/bootstrap.min.js"></script>

  </body>
</html>
