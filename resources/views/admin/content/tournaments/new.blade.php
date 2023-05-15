@include('include.header')


	 <section class="section">
	 <div class="container">
     <nav class="breadcrumb" aria-label="breadcrumbs">

	</nav>




<form method="POST" action="{{route('admin-add-new-tournament')}}">
  @csrf

	

<div class="field">
  <label class="label">Name</label>
  <div class="control">

		<input class="input" type="text" placeholder="Topic name" name="name" value="">
	
  </div>
</div>


<div class="field">
  <label class="label">Description</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" id="description" name="description"></textarea>
	
  </div>
</div>
<div class="field">
<div class="select">
  <select name="structure">
    <option value='linear'>linear</option>
    <option value='graph'>graph</option>
  </select>
</div>
</div>

<div class="field">
 <label class="label">Start date</label>
  <div class="control">
	<input id="start_at" name="start_at" class="input" data-is-range="true" type="date">
  </div>
</div>



<div class="field">
 <label class="label">End date</label>
  <div class="control">
		
	<input id="ends_at" name="ends_at" class="input" data-is-range="true" type="date">

  </div>
</div>



<div class="field">
  <div class="control">
    <label class="checkbox">
		<input type="checkbox" name="published">
     Published
    </label>
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

@include('include.footer')