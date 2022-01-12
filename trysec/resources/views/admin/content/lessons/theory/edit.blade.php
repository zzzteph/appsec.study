@include('include.header')

  <script>
    tinymce.init({
      selector: '#content',
	    plugins: 'code'
    });
  </script>


	 <section class="section">
		 <div class="container">

			<form method="POST" action="{{route('admin-update-theory-lesson',['id' => $lesson->id])}}">
			@method('PUT')
			@csrf

	
	<div class="field">
  <label class="label">Lesson name</label>
  <div class="control">
		<input class="input" type="text" placeholder="Lesson name" name="name" value="{{$lesson->name}}">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" name="description">{{$lesson->description}}</textarea>
	
  </div>
</div>

<hr/>
	
	
	

<div class="field">
  <label class="label">Header</label>
  <div class="control">
		<input class="input" type="text" placeholder="Theory header" name="header" value="{{$lesson->theory->header}}">
  </div>
</div>


<div class="field">
  <label class="label">Content</label>
  <div class="control">
 
<textarea class="textarea" placeholder="Textarea" id="content" name="content">{{$lesson->theory->content}}</textarea>
	
  </div>
</div>


<div class="field">
  <label class="label">Scope</label>
  <div class="control">
		<input class="input" type="text" placeholder="100" name="score" value="{{$lesson->theory->score}}">
  </div>
</div>

<div class="field">
  <div class="control">
    <label class="checkbox">

	@if (isset($lesson->theory->cancel))
		@if ($lesson->theory->cancel)
			<input type="checkbox" name="cancel" checked>
		@else
			<input type="checkbox" name="cancel">
		@endif
	@else
		<input type="checkbox" name="cancel">
	@endif
     Can be canceled?
    </label>
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