@include('include.header')


	 <section class="section">
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">

	</nav>




<form method="POST" action="{{route('admin-add-new-assessment')}}">
  @csrf

	

<div class="field">
  <label class="label">Name(*)</label>
  <div class="control">

		<input class="input" type="text" placeholder="Topic name" name="name" value="">
	
  </div>
</div>



<div class="field">
  <div class="control">
    <label class="checkbox">
		<input type="checkbox" name="randomize" id="randomize" onclick="showLimit()">
     Randomized generation
    </label>
  </div>
</div>

<div class="field">
 <label class="label">Tasks to complete</label>
  <div class="control">
	<input id="duration" name="limit" class="input"  type="input" id="limit">
  </div>
</div>


<div class="field">
  <div class="control">
    <label class="checkbox">
		<input type="checkbox" name="time_limit" id="time_limit" onclick="showDuration()">
     Has time limit to complete?
    </label>
  </div>
</div>

<div class="field">
 <label class="label">Duration (hours)</label>
  <div class="control">
	<input id="duration" name="duration" class="input" id="duration" type="input">
  </div>
</div>


<div class="field">
  <div class="control">
    <label class="checkbox">
		<input type="checkbox" name="can_expire" id="can_expire" onclick="showExpire()">
     Can expire?
    </label>
  </div>
</div>


<div class="field">
 <label class="label">Start date</label>
  <div class="control">
	<input id="start_at" name="starts_at" class="input"  id="starts_at" o data-is-range="true" type="date">
  </div>
</div>

<div class="field">
 <label class="label">End date</label>
  <div class="control">
		
	<input id="ends_at" name="ends_at" class="input" id="ends_at" data-is-range="true" type="date">

  </div>
</div>



<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>

<script>

function showDuration()
{
	
	
	if(document.getElementById('remember').checked)
	{
		document.getElementById("myDIV").style.display = "block";
	}
	else
	{
		document.getElementById("myDIV").style.display = "block";
	}
	  var x = ;
  if (x.style.display === "none") {
    x.
  } else {
    x.style.display = "none";
  }
}


function showExpire()
{
}


function showLimit()
{
}
</script>





@include('include.footer')