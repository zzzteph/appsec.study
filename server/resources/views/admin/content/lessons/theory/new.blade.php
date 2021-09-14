@include('include.header')



	 <section class="section">
		 <div class="container">

			<form method="POST" action="{{route('admin-add-new-theory-lesson')}}">
			@csrf

	
	<div class="field">
  <label class="label">Lesson name</label>
  <div class="control">
		<input class="input" type="text" placeholder="Lesson name" name="name" value="">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description"></textarea>
	
  </div>
</div>

<hr/>
	
	
	

<div class="field">
  <label class="label">Header</label>
  <div class="control">
		<input class="input" type="text" placeholder="Theory header" name="header" value="">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="content"></textarea>
	
  </div>
</div>


<div class="field">
  <label class="label">Scope</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="100">
  </div>
</div>



<div class="field">
  <div class="control">
    <label class="checkbox">
	
	@if (isset($lesson->published))
		@if ($lesson->published)
			<input type="checkbox" name="published" checked>
		@else
			<input type="checkbox" name="published">
		@endif
	@else
		<input type="checkbox" name="published">
	@endif
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